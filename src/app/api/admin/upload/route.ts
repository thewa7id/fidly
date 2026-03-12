import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'card-assets'
const MAX_SIZE_MB = 5

export async function POST(req: NextRequest) {
    // 1. Verify the caller is a logged-in admin/owner
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id || !['owner', 'manager', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse the multipart form body
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB} MB)` }, { status: 413 })
    }

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 415 })
    }

    // 3. Use service client for storage (bypasses storage RLS)
    const svc = createServiceClient()

    // Ensure the bucket exists and is public
    const { data: buckets } = await svc.storage.listBuckets()
    const exists = buckets?.some(b => b.name === BUCKET)
    if (!exists) {
        const { error: createErr } = await svc.storage.createBucket(BUCKET, {
            public: true,
            fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
            allowedMimeTypes: ['image/*'],
        })
        if (createErr) {
            console.error('[upload] bucket creation failed:', createErr.message)
            return NextResponse.json({ error: 'Storage not available' }, { status: 500 })
        }
    }

    // 4. Upload the file
    const ext = file.name.split('.').pop() ?? 'png'
    const orgSlug = profile.organization_id.slice(0, 8)
    const path = `${orgSlug}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error: uploadErr } = await svc.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, {
            contentType: file.type,
            upsert: true,
        })

    if (uploadErr) {
        console.error('[upload] upload error:', uploadErr.message)
        return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    // 5. Return the public URL
    const { data: { publicUrl } } = svc.storage.from(BUCKET).getPublicUrl(data.path)

    return NextResponse.json({ success: true, url: publicUrl })
}
