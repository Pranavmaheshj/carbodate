// Custom Service Worker script for Carbodate
// Handles background workout notification actions (Pause / Resume) without disturbing the user
self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  if (action === 'workout-pause' || action === 'workout-resume') {
    // Keep notification ongoing in notification bar like Strava
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'WORKOUT_NOTIFICATION_ACTION',
            action: action === 'workout-pause' ? 'pause' : 'resume',
          });
        }
      })
    );
  } else {
    // User tapped the notification body -> bring the web app to foreground
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});
