'use client'

function isFirebaseConfigured(): boolean {
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? ''
    return key.length > 0 && !key.includes('your_')
}

export async function requestNotificationPermission(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    if (!isFirebaseConfigured()) {
        console.warn('[FCM] Firebase not configured — skipping notification setup')
        return null
    }

    try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return null

        const { initializeApp, getApps } = await import('firebase/app')
        const { getMessaging, getToken } = await import('firebase/messaging')

        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
        const messaging = getMessaging(app)

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swReg,
        })

        return token
    } catch (error) {
        console.error('[FCM] Permission/token error:', error)
        return null
    }
}

export async function onForegroundMessage(callback: (payload: any) => void) {
    if (typeof window === 'undefined' || !isFirebaseConfigured()) return

    try {
        const { initializeApp, getApps } = await import('firebase/app')
        const { getMessaging, onMessage } = await import('firebase/messaging')

        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
        const messaging = getMessaging(app)
        return onMessage(messaging, callback)
    } catch (error) {
        console.error('[FCM] onMessage error:', error)
    }
}
