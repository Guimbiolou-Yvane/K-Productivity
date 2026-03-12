/**
 * Utilitaire pour envoyer des notifications push via l'API interne /api/push/send.
 * Fire-and-forget : ne bloque jamais l'exécution de l'appelant.
 */
export function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  sendAfter?: string // ISO date string pour programmer l'envoi (optionnel)
) {
  fetch("/api/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title, body, sendAfter }),
  }).catch(() => {
    // Fire-and-forget : on ne bloque jamais l'UI
  });
}
