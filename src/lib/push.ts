import webpush from 'web-push'

// Initialize web-push with VAPID keys from environment variables
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
} else {
    console.warn('VAPID keys are not fully configured. Web Push notifications will not work.')
}

export interface PushMessagePayload {
    title: string
    body: string
    icon?: string
    url?: string
    data?: any
}

/**
 * Send a web push notification to a specific subscription
 * @param subscription The PushSubscription object stored in the database
 * @param payload The message payload
 */
export async function sendWebPush(subscription: webpush.PushSubscription, payload: PushMessagePayload): Promise<boolean> {
    try {
        await webpush.sendNotification(subscription, JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192x192.png',
            url: payload.url || '/',
            data: payload.data || {}
        }))
        return true
    } catch (error: any) {
        console.error('Error sending web push notification:', error)
        if (error.statusCode === 404 || error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            // You should remove this subscription from your database
            return false
        }
        return false
    }
}
