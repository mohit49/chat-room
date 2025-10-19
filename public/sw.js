const CACHE_NAME = 'chat-app-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip chrome-extension and other unsupported schemes
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Skip external domains (only cache same-origin requests)
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');

  let notificationData = {
    title: 'Chat App',
    body: 'You have a new message',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    tag: 'chat-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200], // Vibration pattern
    silent: false,
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icon-192x192.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-192x192.svg'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Service Worker: Push data received:', data);
      
      // Customize notification based on message type
      if (data.type === 'message') {
        if (data.roomId) {
          notificationData.title = `${data.senderUsername} in ${data.roomName || 'Room'}`;
          notificationData.body = data.message || 'New message in room';
          notificationData.tag = `room-${data.roomId}`;
        } else {
          notificationData.title = data.senderUsername || 'New Message';
          notificationData.body = data.message || 'You have a new message';
          notificationData.tag = `dm-${data.senderId}`;
        }
      } else if (data.type === 'follow') {
        notificationData.title = 'New Follower';
        notificationData.body = `${data.senderUsername} started following you`;
        notificationData.tag = `follow-${data.senderId}`;
      } else if (data.type === 'room') {
        notificationData.title = data.roomName || 'Room Update';
        notificationData.body = data.message || 'New room activity';
        notificationData.tag = `room-${data.roomId}`;
      } else {
        notificationData.title = data.title || 'Chat App';
        notificationData.body = data.message || 'You have a new notification';
      }
      
      // Update notification data with custom data
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Error parsing push data', error);
    }
  }

  // Ensure notification shows on home screen even when app is closed
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('Service Worker: Notification displayed successfully');
      })
      .catch((error) => {
        console.error('Service Worker: Failed to show notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click event');

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to appropriate chat based on notification data
            const data = event.notification.data;
            let targetUrl = '/';
            
            if (data) {
              if (data.type === 'message') {
                if (data.roomId) {
                  targetUrl = `/rooms/${data.roomId}/chat`;
                } else if (data.senderId) {
                  targetUrl = `/users/${data.senderId}`;
                }
              } else if (data.type === 'follow' && data.senderId) {
                targetUrl = `/users/${data.senderId}`;
              } else if (data.type === 'room' && data.roomId) {
                targetUrl = `/rooms/${data.roomId}/chat`;
              }
            }
            
            // Send navigation message to client
            client.postMessage({
              type: 'NAVIGATE',
              url: targetUrl
            });
            
            return client.focus();
          }
        }

        // Otherwise, open a new window
        if (clients.openWindow) {
          const data = event.notification.data;
          let targetUrl = '/';
          
          if (data) {
            if (data.type === 'message') {
              if (data.roomId) {
                targetUrl = `/rooms/${data.roomId}/chat`;
              } else if (data.senderId) {
                targetUrl = `/users/${data.senderId}`;
              }
            } else if (data.type === 'follow' && data.senderId) {
              targetUrl = `/users/${data.senderId}`;
            } else if (data.type === 'room' && data.roomId) {
              targetUrl = `/rooms/${data.roomId}/chat`;
            }
          }
          
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event', event.tag);

  if (event.tag === 'send-message') {
    event.waitUntil(
      // Handle offline message sending
      sendOfflineMessages()
    );
  }
});

// Function to handle offline message sending
async function sendOfflineMessages() {
  try {
    // Get offline messages from IndexedDB
    const messages = await getOfflineMessages();
    
    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          // Remove message from offline storage
          await removeOfflineMessage(message.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to send offline message', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error in background sync', error);
  }
}

// Helper functions for IndexedDB operations
function getOfflineMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatAppDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineMessages'], 'readonly');
      const store = transaction.objectStore('offlineMessages');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

function removeOfflineMessage(messageId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatAppDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineMessages'], 'readwrite');
      const store = transaction.objectStore('offlineMessages');
      const deleteRequest = store.delete(messageId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle background message notifications
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: 'background-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false,
        data,
        actions: [
          {
            action: 'open',
            title: 'Open Chat',
            icon: '/icon-192x192.svg'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icon-192x192.svg'
          }
        ]
      })
    );
  }
});
