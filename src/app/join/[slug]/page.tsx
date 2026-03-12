export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import JoinPageClient from './JoinPageClient'

interface Props {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ joined?: string }>
}

async function getOrgData(slug: string) {
    const svc = createServiceClient()

    const { data: org } = await svc
        .from('organizations')
        .select('id, name, slug, logo_url, subscription_status')
        .eq('slug', slug)
        .single()

    if (!org || org.subscription_status === 'inactive') return null

    const [{ data: cardDesign }, { data: stampDesign }, { data: program }, { data: rewards }] = await Promise.all([
        svc.from('card_designs').select('config').eq('organization_id', org.id).single(),
        svc.from('stamp_designs').select('config').eq('organization_id', org.id).single(),
        svc.from('loyalty_programs').select('name, stamps_required').eq('organization_id', org.id).eq('is_active', true).is('deleted_at', null).limit(1).single(),
        svc.from('rewards').select('name, stamps_required').eq('organization_id', org.id).eq('is_active', true).is('deleted_at', null).order('stamps_required').limit(3),
    ])

    return { org, cardDesign: cardDesign?.config ?? null, stampDesign: stampDesign?.config ?? null, program, rewards: rewards ?? [] }
}

export default async function JoinPage({ params }: Props) {
    const { slug } = await params
    const data = await getOrgData(slug)
    if (!data) notFound()

    return <JoinPageClient data={data} orgSlug={slug} />
}
