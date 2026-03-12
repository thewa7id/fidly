function isFirebaseAdminConfigured(): boolean {
    const projectId = process.env.FIREBASE_PROJECT_ID ?? ''
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? ''
    return (
        projectId.length > 0 &&
        !projectId.includes('your_') &&
        clientEmail.includes('@')
    )
}

async function getMessagingInstance() {
    if (!isFirebaseAdminConfigured()) return null

    const admin = await import('firebase-admin')
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        })
    }
    return admin.messaging(admin.apps[0]!)
}

export async function sendPushNotification({
    token,
    title,
    body,
    data,
}: {
    token: string
    title: string
    body: string
    data?: Record<string, string>
}) {
    try {
        const messaging = await getMessagingInstance()
        if (!messaging) {
            console.info('[FCM] Skipping push — Firebase Admin not configured')
            return { success: false, skipped: true }
        }

        const result = await messaging.send({
            token,
            notification: { title, body },
            webpush: {
                notification: {
                    icon: '/icon-192.png',
                    badge: '/badge-72.png',
                    vibrate: [100, 50, 100],
                },
                fcmOptions: { link: data?.link ?? '/' },
            },
            data: data ?? {},
        })

        return { success: true, messageId: result }
    } catch (error) {
        console.error('[FCM] Send error:', error)
        return { success: false, error }
    }
}

export async function sendBulkPushNotifications({
    tokens,
    title,
    body,
    data,
}: {
    tokens: string[]
    title: string
    body: string
    data?: Record<string, string>
}) {
    try {
        const messaging = await getMessagingInstance()
        if (!messaging || tokens.length === 0) return []

        const messages = tokens.map(token => ({
            token,
            notification: { title, body },
            webpush: {
                notification: { icon: '/icon-192.png', badge: '/badge-72.png' },
            },
            data: data ?? {},
        }))

        const batchSize = 500
        const results = []
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize)
            const response = await messaging.sendEach(batch)
            results.push(response)
        }
        return results
    } catch (error) {
        console.error('[FCM] Bulk send error:', error)
        return []
    }
}
