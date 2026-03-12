import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users } from "lucide-react";
import { friendService } from "@/lib/services/friendService";
import { UserProfile } from "@/lib/models/user";
import Image from "next/image";

interface SharedGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, invitedFriends: string[]) => void;
}

export default function SharedGroupModal({ isOpen, onClose, onSave }: SharedGroupModalProps) {
  const [name, setName] = useState("");
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      setName("");
      setSelectedFriends([]);
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedFriends.length === 0) return;
    onSave(name.trim(), selectedFriends);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="neo-card w-full max-w-md bg-surface relative flex flex-col max-h-[85vh]"
        >
          {/* BOUTON FERMER */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 bg-primary border-4 border-foreground p-1 hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <X strokeWidth={4} />
          </motion.button>
          
          <div className="flex items-center justify-between mb-4 border-b-4 border-foreground pb-2 shrink-0">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Users size={24} strokeWidth={3} />
              Nouveau Groupe
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
             <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-sm">Nom du groupe</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: LES SPARTIATES ⚔️"
                className="neo-input font-bold"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-sm">Inviter des amis</label>
              <div className="flex flex-col gap-2 border-4 border-foreground bg-white p-2 min-h-[150px] max-h-[250px] overflow-y-auto w-full custom-scrollbar shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {isLoading ? (
                  <p className="text-center font-bold text-foreground/50 py-4">Chargement...</p>
                ) : friends.length === 0 ? (
                  <p className="text-center font-bold text-foreground/50 py-4 text-sm">Aucun ami trouvé. Ajoute d'abord des amis.</p>
                ) : (
                  friends.map(friend => (
                     <label 
                       key={friend.id}
                       className={`flex items-center justify-between p-2 border-2 transition-colors cursor-pointer ${
                         selectedFriends.includes(friend.id) ? 'bg-primary border-foreground' : 'border-transparent hover:bg-gray-100'
                       }`}
                     >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-foreground bg-surface overflow-hidden flex items-center justify-center shrink-0">
                            {friend.avatar_url ? (
                              <Image src={friend.avatar_url} alt={friend.username} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <span className="font-bold">{friend.username[0].toUpperCase()}</span>
                            )}
                          </div>
                          <span className="font-black uppercase text-sm">{friend.username}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-black border-2 border-foreground"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={() => toggleFriend(friend.id)}
                        />
                     </label>
                  ))
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={!name.trim() || selectedFriends.length === 0}
              className="neo-btn bg-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed mx-auto w-11/12"
            >
              Envoyer l'invitation
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
