import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import * as jwt from 'jsonwebtoken'

export interface GoogleWalletConfig {
    issuerId: string
    serviceAccountEmail: string
    privateKey: string
}

export class GoogleWalletProvider {
    private auth: JWT
    private issuerId: string

    constructor(config: GoogleWalletConfig) {
        this.issuerId = config.issuerId
        this.auth = new google.auth.JWT({
            email: config.serviceAccountEmail,
            key: config.privateKey.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        })
    }

    /**
     * Creates or updates a LoyaltyClass (template) for an organization/program
     */
    async createOrUpdateClass(classId: string, payload: {
        programName: string,
        issuerName: string,
        logoUrl?: string,
        heroImageUrl?: string,
        hexColor?: string
    }) {
        const wallet = google.walletobjects({ version: 'v1', auth: this.auth })

        const loyaltyClass: any = {
            id: `${this.issuerId}.${classId}`,
            issuerName: payload.issuerName,
            programName: payload.programName,
            reviewStatus: 'UNDER_REVIEW',
            programLogo: payload.logoUrl ? {
                sourceUri: { uri: payload.logoUrl },
                contentDescription: { defaultValue: { language: 'en-US', value: 'LOGO' } }
            } : undefined,
            wideProgramLogo: payload.logoUrl ? {
                sourceUri: { uri: payload.logoUrl },
                contentDescription: { defaultValue: { language: 'en-US', value: 'LOGO' } }
            } : undefined,
            heroImage: payload.heroImageUrl ? {
                sourceUri: { uri: payload.heroImageUrl },
                contentDescription: { defaultValue: { language: 'en-US', value: 'Hero Image' } }
            } : undefined,
            hexBackgroundColor: payload.hexColor ?? '#1a1a2e'
        }

        try {
            await wallet.loyaltyclass.get({ resourceId: loyaltyClass.id })
            // If exists, update
            const res = await wallet.loyaltyclass.patch({
                resourceId: loyaltyClass.id,
                requestBody: loyaltyClass
            })
            return res.data
        } catch (err: any) {
            if (err.code === 404) {
                // Not found, insert
                const res = await wallet.loyaltyclass.insert({
                    requestBody: loyaltyClass
                })
                return res.data
            }
            throw err
        }
    }

    /**
     * Creates or updates a LoyaltyObject (individual card)
     */
    async createOrUpdateObject(classId: string, objectId: string, payload: {
        customerName: string,
        balance: string,
        label: string,
        barcodeValue: string,
        secondaryLabel?: string,
        secondaryValue?: string,
        stampImageUrl?: string
    }) {
        const wallet = google.walletobjects({ version: 'v1', auth: this.auth })
        const fullClassId = `${this.issuerId}.${classId}`
        const fullObjectId = `${this.issuerId}.${objectId}`

        const loyaltyObject: any = {
            id: fullObjectId,
            classId: fullClassId,
            state: 'ACTIVE',
            accountName: payload.customerName,
            barcode: {
                type: 'QR_CODE',
                value: payload.barcodeValue
            },
            loyaltyPoints: {
                balance: { string: payload.balance },
                label: payload.label
            },
            textModulesData: payload.secondaryLabel ? [
                {
                    id: 'reward_status',
                    header: payload.secondaryLabel,
                    body: payload.secondaryValue || ''
                }
            ] : [],
            imageModulesData: payload.stampImageUrl ? [{
                mainImage: {
                    sourceUri: { uri: payload.stampImageUrl },
                    contentDescription: {
                        defaultValue: { language: 'en-US', value: 'Stamp Progress' }
                    }
                },
                id: 'stamp_progress'
            }] : []
        }

        try {
            await wallet.loyaltyobject.get({ resourceId: fullObjectId })
            // Update
            const res = await wallet.loyaltyobject.patch({
                resourceId: fullObjectId,
                requestBody: loyaltyObject
            })
            return res.data
        } catch (err: any) {
            if (err.code === 404) {
                // Insert
                const res = await wallet.loyaltyobject.insert({
                    requestBody: loyaltyObject
                })
                return res.data
            }
            throw err
        }
    }

    /**
     * Generates a "Save to Google Wallet" JWT link
     */
    generateSaveLink(payload: { classId: string, objectId: string }) {
        const fullClassId = `${this.issuerId}.${payload.classId}`
        const fullObjectId = `${this.issuerId}.${payload.objectId}`

        const claims = {
            iss: this.auth.email,
            aud: 'google',
            origins: [],
            typ: 'savetowallet',
            payload: {
                loyaltyObjects: [{
                    id: fullObjectId,
                    classId: fullClassId
                }]
            }
        }

        const token = jwt.sign(claims, this.auth.key as string, { algorithm: 'RS256' })
        return `https://pay.google.com/gp/v/save/${token}`
    }

    /**
     * Appends a message to a specific LoyaltyObject
     */
    async addMessageToObject(objectId: string, payload: { header: string, body: string }) {
        const wallet = google.walletobjects({ version: 'v1', auth: this.auth })
        const fullObjectId = `${this.issuerId}.${objectId}`

        try {
            await wallet.loyaltyobject.addmessage({
                resourceId: fullObjectId,
                requestBody: {
                    message: {
                        header: payload.header,
                        body: payload.body,
                        displayInterval: undefined // optional, means indefinitely or until user dismisses
                    }
                }
            })
            return true
        } catch (err: any) {
            console.error(`[Google Wallet] Failed to add message to ${objectId}`, err.message)
            return false
        }
    }
}
