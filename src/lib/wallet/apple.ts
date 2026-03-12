import { PKPass } from 'passkit-generator'
import { CardDesignConfig, StampDesignConfig } from '@/lib/types'

export interface AppleWalletConfig {
    teamId: string
    passTypeIdentifier: string
    privateKey: string
    signerCertificate: string
    wwdrCertificate: string
}

export class AppleWalletProvider {
    private config: AppleWalletConfig

    constructor(config: AppleWalletConfig) {
        this.config = config
    }

    /**
     * Converts a Hex color (e.g., #1a1a2e) to rgb() format required by Apple Wallet
     */
    private hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000')
        if (result) {
            const r = parseInt(result[1], 16)
            const g = parseInt(result[2], 16)
            const b = parseInt(result[3], 16)
            return `rgb(${r}, ${g}, ${b})`
        }
        return 'rgb(0, 0, 0)'
    }

    /**
     * Generates a .pkpass file Buffer for an individual customer
     */
    async generatePass(payload: {
        customerName: string,
        publicToken: string,
        organizationName: string,
        design: CardDesignConfig,
        balanceDisplay: string,
        label: string,
        secondaryLabel: string,
        secondaryValue: string,
        logoBuffer?: Buffer,
        stripBuffer?: Buffer,           // E.g., The raw stamp-image buffer to perfectly match the web layout
        backgroundBuffer?: Buffer
    }): Promise<Buffer> {
        
        // 1. Initialize pass payload with exactly matching colors
        const pass = new PKPass({
            "pass.json": Buffer.from(JSON.stringify({
                formatVersion: 1,
                passTypeIdentifier: this.config.passTypeIdentifier,
                serialNumber: payload.publicToken,
                teamIdentifier: this.config.teamId,
                organizationName: payload.organizationName,
                description: `Loyalty Card for ${payload.organizationName}`,
                logoText: payload.design.brandName || payload.organizationName,
                backgroundColor: this.hexToRgb(payload.design.backgroundColor),
                foregroundColor: this.hexToRgb(payload.design.textColor || '#ffffff'),
                labelColor: this.hexToRgb(payload.design.accentColor || '#ffffff'),
                barcode: {
                    message: payload.publicToken,
                    format: payload.design.codeType === 'barcode' ? 'PKBarcodeFormatCode128' : 'PKBarcodeFormatQR',
                    messageEncoding: 'iso-8859-1'
                },
                storeCard: {
                    primaryFields: [
                        {
                            key: "balance",
                            label: payload.label.toUpperCase(),
                            value: payload.balanceDisplay
                        }
                    ],
                    secondaryFields: [
                        {
                            key: "reward",
                            label: payload.secondaryLabel,
                            value: payload.secondaryValue
                        }
                    ],
                    auxiliaryFields: [
                        {
                            key: "name",
                            label: "MEMBER",
                            value: payload.customerName
                        }
                    ]
                }
            }))
        }, {
            wwdr: this.config.wwdrCertificate,
            signerCert: this.config.signerCertificate,
            signerKey: this.config.privateKey
        })

        // 2. Map Dynamic Images into the Apple bundle
        if (payload.logoBuffer) {
            // Apple requires logo.png, logo@2x.png etc
            pass.addBuffer('logo.png', payload.logoBuffer)
            pass.addBuffer('logo@2x.png', payload.logoBuffer)
        }
        if (payload.stripBuffer) {
            // High visibility visual (acts exactly like our web card stamp/hero visual)
            pass.addBuffer('strip.png', payload.stripBuffer)
            pass.addBuffer('strip@2x.png', payload.stripBuffer)
        } else if (payload.backgroundBuffer) {
            pass.addBuffer('background.png', payload.backgroundBuffer)
        }

        // 3. Output the compiled multi-part buffer
        return pass.getAsBuffer()
    }
}
