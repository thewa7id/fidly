// Database types for Goyalty platform

export type SubscriptionPlan = 'free' | 'pro' | 'platinium'
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'cancelled' | 'trial'
export type UserRole = 'super_admin' | 'owner' | 'manager' | 'employee'
export type LoyaltyType = 'stamps' | 'points'
export type TransactionType = 'earn_stamp' | 'earn_points' | 'redeem_reward' | 'manual_adjust' | 'expire'
export type RewardType = 'free_item' | 'percentage_discount' | 'fixed_discount' | 'custom'

export interface Subscription {
    id: string
    name: SubscriptionPlan
    display_name: string
    max_customers: number | null
    max_branches: number | null
    max_employees: number | null
    price_monthly: number
    price_yearly: number
    features: string[]
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Organization {
    id: string
    name: string
    slug: string
    logo_url: string | null
    website: string | null
    phone: string | null
    email: string | null
    address: string | null
    subscription_id: string | null
    subscription_status: SubscriptionStatus
    subscription_expires_at: string | null
    trial_ends_at: string | null
    owner_id: string | null
    metadata: Record<string, unknown>
    is_active: boolean
    deleted_at: string | null
    created_at: string
    updated_at: string
    // Joined
    subscription?: Subscription
}

export interface Branch {
    id: string
    organization_id: string
    name: string
    address: string | null
    phone: string | null
    email: string | null
    qr_code: string | null
    is_active: boolean
    deleted_at: string | null
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    organization_id: string | null
    branch_id: string | null
    email: string
    full_name: string | null
    avatar_url: string | null
    role: UserRole
    is_active: boolean
    deleted_at: string | null
    created_at: string
    updated_at: string
    // Joined
    organization?: Organization
    branch?: Branch
}

export interface LoyaltyProgram {
    id: string
    organization_id: string
    name: string
    type: LoyaltyType
    stamps_required: number | null
    points_per_currency_unit: number | null
    currency_unit: string | null
    points_expiry_days: number | null
    stamps_expiry_days: number | null
    is_active: boolean
    deleted_at: string | null
    created_at: string
    updated_at: string
}

export interface Reward {
    id: string
    organization_id: string
    loyalty_program_id: string
    name: string
    description: string | null
    type: RewardType
    value: number | null
    stamps_required: number | null
    points_required: number | null
    image_url: string | null
    terms: string | null
    is_active: boolean
    deleted_at: string | null
    created_at: string
    updated_at: string
}

export interface Customer {
    id: string
    organization_id: string
    auth_user_id: string | null
    email: string | null
    phone: string | null
    full_name: string | null
    avatar_url: string | null
    public_token: string
    date_of_birth: string | null
    total_stamps: number
    available_stamps: number
    total_points: number
    available_points: number
    total_visits: number
    total_redeemed: number
    last_visit_at: string | null
    is_active: boolean
    deleted_at: string | null
    joined_at: string
    created_at: string
    updated_at: string
}

export interface Transaction {
    id: string
    organization_id: string
    branch_id: string
    customer_id: string
    loyalty_program_id: string | null
    processed_by: string | null
    type: TransactionType
    stamps_earned: number
    stamps_redeemed: number
    stamps_balance_after: number | null
    points_earned: number
    points_redeemed: number
    points_balance_after: number | null
    reward_id: string | null
    reward_snapshot: Record<string, unknown> | null
    purchase_amount: number | null
    reference_number: string | null
    notes: string | null
    metadata: Record<string, unknown>
    push_sent: boolean
    created_at: string
    // Joined
    customer?: Customer
    branch?: Branch
    reward?: Reward
    processor?: User
}

export interface SocialLinks {
    instagram?: string
    twitter?: string
    facebook?: string
    tiktok?: string
    website?: string
}

export interface CardDesignConfig {
    backgroundType: 'solid' | 'gradient' | 'image'
    backgroundColor: string
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
    backgroundImageUrl: string | null
    accentColor: string
    textColor: string
    brandName: string
    logoUrl: string | null
    fontFamily: string
    progressBarStyle: 'rounded' | 'square' | 'pill'
    progressBarColor: string
    cardBorderRadius: number
    layoutType: 'classic' | 'modern'
    heroImageUrl: string | null
    codeType: 'qr' | 'barcode'
    showBranchName: boolean
    socialLinks: SocialLinks | null
}

export interface StampDesignConfig {
    iconType: 'star' | 'heart' | 'circle' | 'crown' | 'diamond' | 'coffee' | 'custom'
    iconUrl: string | null
    filledColor: string
    emptyColor: string
    filledAnimation: 'bounce' | 'pulse' | 'scale' | 'none'
    emptyStyle: 'outline' | 'filled' | 'dashed'
    size: 'small' | 'medium' | 'large'
    labelText: string
}

export interface CardDesign {
    id: string
    organization_id: string
    config: CardDesignConfig
    created_at: string
    updated_at: string
}

export interface StampDesign {
    id: string
    organization_id: string
    config: StampDesignConfig
    created_at: string
    updated_at: string
}

export interface PushToken {
    id: string
    customer_id: string
    organization_id: string
    token: string
    platform: string
    is_active: boolean
    last_used_at: string | null
    created_at: string
}

export type NfcCardStatus = 'active' | 'inactive' | 'blocked'

export interface NfcCard {
    id: string
    organization_id: string
    customer_id: string | null
    nfc_uid: string
    status: NfcCardStatus
    linked_at: string | null
    deactivated_at: string | null
    created_at: string
    updated_at: string
}


export interface AnalyticsSnapshot {
    id: string
    organization_id: string
    branch_id: string | null
    snapshot_date: string
    new_customers: number
    active_customers: number
    total_stamps_earned: number
    total_points_earned: number
    total_rewards_redeemed: number
    total_transactions: number
    created_at: string
}

// API Response types
export interface ApiResponse<T> {
    data: T | null
    error: string | null
    success: boolean
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

// Analytics types
export interface AnalyticsSummary {
    totalCustomers: number
    activeCustomers: number
    totalStampsEarned: number
    totalPointsEarned: number
    totalRedemptions: number
    totalTransactions: number
    redemptionRate: number
    topBranch: string | null
    growthData: { date: string; newCustomers: number; transactions: number }[]
}
// Wallet types
export type WalletProvider = 'google' | 'apple'

export interface WalletProviderConfig {
    id: string
    org_id: string
    provider: WalletProvider
    config: {
        issuer_id?: string
        service_account_email?: string
        private_key?: string
        pass_type_id?: string
        team_id?: string
        [key: string]: any
    }
    created_at: string
    updated_at: string
}

export interface WalletGoogleClass {
    id: string
    org_id: string
    program_id: string | null
    class_id: string
    status: 'active' | 'inactive'
    brand_payload: Record<string, any>
    created_at: string
    updated_at: string
}

export interface WalletGoogleObject {
    id: string
    org_id: string
    program_id: string | null
    customer_id: string
    object_id: string
    state: 'active' | 'inactive'
    last_synced_at: string | null
    created_at: string
    updated_at: string
}
