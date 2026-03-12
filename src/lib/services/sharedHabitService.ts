import { supabase } from "../supabase/client";
import { HabitCategory } from "../models/habit";
import { SharedGroup, UISharedHabit } from "../models/sharedHabit";
import { UserProfile } from "../models/user";
import { sendPushNotification } from "../utils/pushNotification";

class SharedHabitService {
  /**
   * Créer un groupe d'objectifs partagés
   */
  async createGroup(name: string, invitedUserIds: string[]): Promise<SharedGroup> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non connecté");

    // 1. Créer le groupe (sans .select() pour éviter le conflit RLS)
    const { data: group, error: groupError } = await supabase
      .from("shared_groups")
      .insert({ name, creator_id: user.id })
      .select("*")
      .single();

    if (groupError) {
      console.error("Erreur création groupe:", groupError);
      throw groupError;
    }

    // 2. Ajouter les membres au groupe (Créateur + Invités)
    const membersToInsert = [
      { group_id: group.id, user_id: user.id },
      ...invitedUserIds.map((id) => ({ group_id: group.id, user_id: id })),
    ];

    const { error: membersError } = await supabase
      .from("shared_group_members")
      .insert(membersToInsert);

    if (membersError) {
      console.error("Erreur ajout membres:", membersError);
      await supabase.from("shared_groups").delete().eq("id", group.id);
      throw membersError;
    }

    // 🔔 Notifier chaque invité qu'il a été ajouté à un groupe
    try {
      const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      const myName = myProfile?.username || "Quelqu'un";
      for (const invitedId of invitedUserIds) {
        sendPushNotification(
          invitedId,
          "👥 Invitation groupe !",
          `${myName} t'a invité dans le groupe "${name}". Venez atteindre vos objectifs ensemble !`
        );
      }
    } catch {}

    return group;
  }

  /**
   * Récupère tous les groupes d'objectifs partagés de l'utilisateur
   */
  async fetchUserGroups(): Promise<{group: SharedGroup, members: UserProfile[]}[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Récupérer les identifiants de groupes de l'utilisateur
    const { data: memberships, error: membershipError } = await supabase
      .from("shared_group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (membershipError) {
      console.error("fetchUserGroups membership error:", membershipError);
      return [];
    }
    if (!memberships || memberships.length === 0) return [];

    const groupIds = memberships.map((m) => m.group_id);

    // Récupérer les infos des groupes
    const { data: groupsData, error: groupsError } = await supabase
      .from("shared_groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("fetchUserGroups error:", groupsError);
      return [];
    }

    // Pour chaque groupe, récupérer les membres avec profils
    const results: {group: SharedGroup, members: UserProfile[]}[] = [];

    for (const g of groupsData) {
      const { data: memberRows, error: membersError } = await supabase
        .from("shared_group_members")
        .select("user_id")
        .eq("group_id", g.id);

      if (membersError) {
        console.error("members error for group", g.id, membersError);
        results.push({ group: g, members: [] });
        continue;
      }

      const memberIds = memberRows.map(m => m.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds);

      if (profilesError) {
        console.error("profiles error:", profilesError);
        results.push({ group: g, members: [] });
        continue;
      }

      results.push({ group: g, members: profiles as UserProfile[] });
    }

    return results;
  }

  /**
   * Récupère toutes les habitudes partagées d'un groupe spécifique
   */
  async fetchHabitsByGroup(groupId: string): Promise<UISharedHabit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Récupérer le groupe
    const { data: groupData, error: groupError } = await supabase
      .from("shared_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError) {
      console.error("fetchHabitsByGroup groupError:", groupError);
      return [];
    }

    // Récupérer les membres avec profils
    const { data: memberRows } = await supabase
      .from("shared_group_members")
      .select("user_id")
      .eq("group_id", groupId);

    const memberIds = (memberRows || []).map(m => m.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberIds);

    const members: UserProfile[] = (profiles || []) as UserProfile[];

    // Récupérer les objectifs du groupe
    const { data: habits, error: habitsError } = await supabase
      .from("shared_habits")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (habitsError) {
      console.error("fetchHabitsByGroup habitsError:", habitsError);
      return [];
    }
    if (!habits || habits.length === 0) return [];

    const habitIds = habits.map(h => h.id);

    // Récupérer les logs correspondants à ces habitudes
    const { data: logs, error: logsError } = await supabase
      .from("shared_habit_logs")
      .select("*")
      .in("shared_habit_id", habitIds);

    if (logsError) {
      console.error("fetchHabitsByGroup logsError:", logsError);
    }

    // Regrouper les logs par {date_userId} = true
    return habits.map(habit => {
      const habitLogs = (logs || []).filter(lg => lg.shared_habit_id === habit.id);
      const completedLogs: { [key: string]: boolean } = {};

      habitLogs.forEach(lg => {
        completedLogs[`${lg.completed_date}_${lg.user_id}`] = true;
      });

      return {
        ...habit,
        groupInfo: groupData,
        members,
        completedLogs,
      } as UISharedHabit;
    });
  }

  /**
   * Créer un objectif partagé dans un groupe
   */
  async addSharedHabit(
    groupId: string,
    name: string,
    category: HabitCategory,
    frequency: string[],
    color: string | undefined,
    icon: string | undefined,
    startDate: string,
    endDate: string,
    time: string | undefined,
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    const target_month = startDate.substring(0, 7);

    const { data, error } = await supabase
      .from("shared_habits")
      .insert({
        group_id: groupId,
        created_by: user.id,
        name,
        category,
        frequency,
        color,
        icon,
        time,
        start_date: startDate,
        end_date: endDate,
        target_month,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer une habitude partagée
   */
  async deleteSharedHabit(habitId: string) {
    const { error } = await supabase.from("shared_habits").delete().eq("id", habitId);
    if (error) throw error;
  }
  
  /**
   * Supprimer un groupe
   */
  async deleteSharedGroup(groupId: string) {
     const { error } = await supabase.from("shared_groups").delete().eq("id", groupId);
     if (error) throw error;
  }

  /**
   * Valider ou Invalider (Toggle) un objectif partagé pour l'utilisateur courant
   */
  async toggleLog(sharedHabitId: string, customDate: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non connecté");

    // Voir s'il y a déjà un log
    const { data: existingLogs, error: searchError } = await supabase
      .from("shared_habit_logs")
      .select("id")
      .eq("shared_habit_id", sharedHabitId)
      .eq("user_id", user.id)
      .eq("completed_date", customDate);

    if (searchError) throw searchError;

    if (existingLogs && existingLogs.length > 0) {
      // Dé-valider (supprimer le log)
      const { error: deleteError } = await supabase
        .from("shared_habit_logs")
        .delete()
        .eq("id", existingLogs[0].id);
      if (deleteError) throw deleteError;
    } else {
      // Valider (insérer le log)
      const { error: insertError } = await supabase
        .from("shared_habit_logs")
        .insert({
          shared_habit_id: sharedHabitId,
          user_id: user.id,
          completed_date: customDate
        });
      if (insertError) throw insertError;

      // 🔔 Notifier les autres membres du groupe que l'utilisateur a validé
      try {
        // Récupérer l'habitude pour connaître le groupe
        const { data: habit } = await supabase.from("shared_habits").select("name, group_id").eq("id", sharedHabitId).single();
        if (habit) {
          const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
          const myName = myProfile?.username || "Quelqu'un";
          // Récupérer les autres membres
          const { data: members } = await supabase.from("shared_group_members").select("user_id").eq("group_id", habit.group_id).neq("user_id", user.id);
          if (members) {
            for (const m of members) {
              sendPushNotification(
                m.user_id,
                "✅ Objectif validé !",
                `${myName} a validé "${habit.name}". À ton tour ! 💪`
              );
            }
          }
        }
      } catch {}
    }
  }
}

export const sharedHabitService = new SharedHabitService();
