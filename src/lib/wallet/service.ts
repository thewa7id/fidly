import { createServiceClient } from '@/lib/supabase/server'
import { GoogleWalletProvider } from './google'
import { AppleWalletProvider } from './apple'
import { WalletProviderConfig } from '@/lib/types'

export class WalletService {
    private svc = createServiceClient()

    /**
     * Get provider configuration for an organization
     */
    async getProviderConfig(orgId: string, provider: 'google' | 'apple'): Promise<WalletProviderConfig | null> {
        const { data } = await this.svc
            .from('wallet_providers_config')
            .select('*')
            .eq('org_id', orgId)
            .eq('provider', provider)
            .single()

        return data
    }

    /**
     * Initializes a Google Wallet provider instance using platform-level environment variables
     */
    private async getGoogleProvider(orgId: string) {
        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
        const email = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
        const key = process.env.GOOGLE_WALLET_PRIVATE_KEY

        if (!issuerId || !email || !key) {
            throw new Error('Google Wallet platform credentials not configured')
        }

        return new GoogleWalletProvider({
            issuerId,
            serviceAccountEmail: email,
            privateKey: key
        })
    }

    /**
     * Ensures a LoyaltyClass exists and returns its ID
     */
    async ensureClass(orgId: string, programId: string | null) {
        // Find existing record in DB
        const { data: existing } = await this.svc
            .from('wallet_google_classes')
            .select('*')
            .eq('org_id', orgId)
            .eq('program_id', programId)
            .single()

        // Fetch branding and create/update
        const { data: org } = await this.svc.from('organizations').select('*').eq('id', orgId).single()
        const { data: design } = await this.svc.from('card_designs').select('*').eq('organization_id', orgId).single()
        let program = null
        if (programId) {
            const { data: p } = await this.svc.from('loyalty_programs').select('*').eq('id', programId).single()
            program = p
        }

        const google = await this.getGoogleProvider(orgId)
        const classId = programId ? `program_${programId.split('-')[0]}` : `org_${orgId.split('-')[0]}`

        await google.createOrUpdateClass(classId, {
            issuerName: org.name,
            programName: program?.name || 'Loyalty Program',
            logoUrl: design?.config?.logoUrl || org.logo_url,
            heroImageUrl: design?.config?.heroImageUrl || design?.config?.backgroundImageUrl,
            hexColor: design?.config?.backgroundColor
        })

        if (existing) {
            // Update timestamp/payload in DB
            await this.svc.from('wallet_google_classes').update({
                brand_payload: design?.config || {},
                updated_at: new Date().toISOString()
            }).eq('id', existing.id)
            return existing
        }

        const { data: newClass } = await this.svc
            .from('wallet_google_classes')
            .insert({
                org_id: orgId,
                program_id: programId,
                class_id: classId,
                brand_payload: design?.config || {}
            })
            .select()
            .single()

        return newClass
    }

    /**
     * Ensures a LoyaltyObject exists and is synced
     */
    async syncCustomerWallet(customerId: string, programId: string | null) {
        const { data: customer } = await this.svc
            .from('customers')
            .select('*, organizations(*)')
            .eq('id', customerId)
            .single()

        if (!customer) throw new Error('Customer not found')

        const orgId = customer.organization_id
        const googleEnabled = await this.getProviderConfig(orgId, 'google')
        if (!googleEnabled) return

        // 1. Ensure Class exists
        const loyaltyClass = await this.ensureClass(orgId, programId)

        // 2. Sync Object
        const google = await this.getGoogleProvider(orgId)
        const objectId = `cust_${customer.id.split('-')[0]}`

        const balanceDisplay = customer.available_stamps > 0
            ? `${customer.available_stamps} Stamps`
            : `${customer.available_points} Points`

        let secondaryLabel = 'Next Reward'
        let secondaryValue = 'Collect more!'

        const { data: program } = await this.svc.from('loyalty_programs').select('*').eq('id', programId).single()
        if (program) {
            if (program.type === 'stamps') {
                const remaining = (program.stamps_required ?? 10) - customer.available_stamps
                secondaryValue = remaining <= 0 ? 'Reward Ready!' : `${remaining} more to go`
            } else {
                // Points logic
                secondaryValue = 'Keep earning!'
            }
        }

        // Build stamp image URL for Google Wallet visual
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
            
        if (baseUrl.includes('fidly.ma') && !baseUrl.includes('www.fidly.ma')) {
            baseUrl = baseUrl.replace('https://fidly.ma', 'https://www.fidly.ma')
        }
        
        const stampImageUrl = (program?.type === 'stamps' && baseUrl)
            ? `${baseUrl.replace(/\/$/, '')}/api/wallet/stamp-image?token=${customer.public_token}`
            : undefined

        await google.createOrUpdateObject(loyaltyClass.class_id, objectId, {
            customerName: customer.full_name || 'Guest',
            balance: balanceDisplay,
            label: customer.available_stamps > 0 ? 'Stamps' : 'Points',
            barcodeValue: customer.public_token,
            secondaryLabel,
            secondaryValue,
            stampImageUrl
        })

        // 3. Update DB
        const { data: existingObject } = await this.svc
            .from('wallet_google_objects')
            .select('*')
            .eq('customer_id', customerId)
            .eq('program_id', programId)
            .single()

        if (existingObject) {
            await this.svc
                .from('wallet_google_objects')
                .update({ last_synced_at: new Date().toISOString() })
                .eq('id', existingObject.id)
        } else {
            await this.svc
                .from('wallet_google_objects')
                .insert({
                    org_id: orgId,
                    program_id: programId,
                    customer_id: customerId,
                    object_id: objectId,
                    last_synced_at: new Date().toISOString()
                })
        }
    }

    /**
     * Gets a save link for a customer
     */
    async getGoogleWalletLink(customerId: string, programId: string | null) {
        const { data: customer } = await this.svc.from('customers').select('organization_id').eq('id', customerId).single()
        if (!customer) throw new Error('Customer not found')

        const loyaltyClass = await this.ensureClass(customer.organization_id, programId)
        const google = await this.getGoogleProvider(customer.organization_id)

        const objectId = `cust_${customerId.split('-')[0]}`

        return google.generateSaveLink({
            classId: loyaltyClass.class_id,
            objectId: objectId
        })
    }

    /**
     * Appends a message to a customer's existing Google Wallet Pass
     */
    async addMessageToCustomerPass(customerId: string, message: { header: string, body: string }) {
        const { data: object } = await this.svc
            .from('wallet_google_objects')
            .select('org_id, object_id')
            .eq('customer_id', customerId)
            .single()

        if (!object) return false

        const google = await this.getGoogleProvider(object.org_id)
        return google.addMessageToObject(object.object_id, message)
    }

    /**
     * Initializes an Apple Wallet provider instance using environment variables
     */
    private async getAppleProvider(orgId: string) {
        const teamId = process.env.APPLE_WALLET_TEAM_ID
        const passTypeIdentifier = process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER
        const privateKey = process.env.APPLE_WALLET_PRIVATE_KEY
        const wwdrCertificate = process.env.APPLE_WALLET_WWDR_CERTIFICATE
        const signerCertificate = process.env.APPLE_WALLET_SIGNER_CERTIFICATE

        if (!teamId || !passTypeIdentifier || !privateKey || !wwdrCertificate || !signerCertificate) {
            throw new Error('Apple Wallet platform credentials not configured')
        }

        return new AppleWalletProvider({
            teamId,
            passTypeIdentifier,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            signerCertificate: signerCertificate.replace(/\\n/g, '\n'),
            wwdrCertificate: wwdrCertificate.replace(/\\n/g, '\n')
        })
    }

    /**
     * Generates a fully compiled .pkpass Buffer for Apple Wallet
     */
    async getAppleWalletPassBuffer(customerId: string, programId: string | null): Promise<Buffer> {
        const { data: customer } = await this.svc
            .from('customers')
            .select('*, organizations(*)')
            .eq('id', customerId)
            .single()

        if (!customer) throw new Error('Customer not found')

        const orgId = customer.organization_id
        const appleEnabled = await this.getProviderConfig(orgId, 'apple')
        if (!appleEnabled) throw new Error('Apple Wallet disabled for this organization')

        const apple = await this.getAppleProvider(orgId)

        // Fetch design configs
        const { data: design } = await this.svc.from('card_designs').select('*').eq('organization_id', orgId).single()
        const { data: program } = await this.svc.from('loyalty_programs').select('*').eq('id', programId || customer.programs?.[0]?.id).single()

        const balanceDisplay = customer.available_stamps > 0
            ? `${customer.available_stamps}`
            : `${customer.available_points}`

        const label = customer.available_stamps > 0 ? 'Stamps' : 'Points'

        let secondaryLabel = 'Next Reward'
        let secondaryValue = 'Collect more!'

        if (program) {
            if (program.type === 'stamps') {
                const remaining = (program.stamps_required ?? 10) - customer.available_stamps
                secondaryValue = remaining <= 0 ? 'Reward Ready!' : `${remaining} to go`
            } else {
                secondaryValue = 'Keep earning!'
            }
        }

        // Fetch dynamic stamp image buffer internally
        let stripBuffer: Buffer | undefined

        let baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        if (baseUrl.includes('fidly.ma') && !baseUrl.includes('www.fidly.ma')) {
            baseUrl = baseUrl.replace('https://fidly.ma', 'https://www.fidly.ma')
        }
        baseUrl = baseUrl.replace(/\/$/, '')

        if (program?.type === 'stamps') {
            try {
                const res = await fetch(`${baseUrl}/api/wallet/stamp-image?token=${customer.public_token}`)
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer()
                    stripBuffer = Buffer.from(arrayBuffer)
                }
            } catch (err) {
                console.warn('Failed to fetch stamp image for Apple Wallet strip:', err)
            }
        }

        // Provide default empty design if none exists
        const safeDesign = design?.config || {
            brandName: customer.organizations?.name || 'Loyalty Card',
            backgroundColor: '#1a1a2e',
            textColor: '#ffffff',
            accentColor: '#e94560',
            codeType: 'qr'
        }

        return apple.generatePass({
            customerName: customer.full_name || 'Valued Customer',
            publicToken: customer.public_token,
            organizationName: customer.organizations?.name || 'Loyalty Card',
            design: safeDesign,
            balanceDisplay,
            label,
            secondaryLabel,
            secondaryValue,
            stripBuffer
        })
    }
}
