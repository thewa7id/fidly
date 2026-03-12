// Firebase Messaging Service Worker
// This file handles background push notifications when the app is closed or in the background.
// It will be a no-op until Firebase credentials are configured.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Only initialize Firebase if config is injected at runtime
if (typeof importScripts === 'function') {
    try {
        importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
        importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

        // Firebase config will be injected dynamically — only init if present
        self.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'FIREBASE_CONFIG') {
                const config = event.data.config
                if (config && config.apiKey && !config.apiKey.includes('your_')) {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(config)
                    }
                    const messaging = firebase.messaging()
                    messaging.onBackgroundMessage((payload) => {
                        const { title = 'Goyalty', body = 'You have a new notification' } = payload.notification ?? {}
                        self.registration.showNotification(title, {
                            body,
                            icon: '/icon-192.png',
                            badge: '/badge-72.png',
                        })
                    })
                }
            }
        })
    } catch (e) {
        // Firebase scripts failed to load — service worker will be a no-op
        console.warn('[SW] Firebase not available:', e)
    }
}
