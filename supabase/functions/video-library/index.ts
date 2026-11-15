const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const getSupabaseHeaders = (serviceRoleKey: string) => ({
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
});

async function createSignedUrl(
    supabaseUrl: string,
    headers: ReturnType<typeof getSupabaseHeaders>,
    objectPath: string,
): Promise<string> {
    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(
        `${supabaseUrl}/storage/v1/object/sign/vip-videos/${encodedPath}`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({ expiresIn: 3600 }),
        },
    );
    if (!response.ok) throw new Error('Unable to sign a video library object.');

    const data: unknown = await response.json();
    if (!isRecord(data) || typeof data.signedURL !== 'string') {
        throw new Error('Invalid signed storage response.');
    }

    const signedPath = data.signedURL;
    if (signedPath.startsWith('http')) return signedPath;
    if (signedPath.startsWith('/storage/v1/')) return `${supabaseUrl}${signedPath}`;
    return `${supabaseUrl}/storage/v1${signedPath.startsWith('/') ? signedPath : `/${signedPath}`}`;
}

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        return jsonResponse({ error: 'Video service is not configured.' }, 503);
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Invalid request body.' }, 400);
    }

    if (!isRecord(payload) || (payload.action !== 'public' && payload.action !== 'members')) {
        return jsonResponse({ error: 'Invalid video access request.' }, 400);
    }

    if (payload.action === 'members') {
        if (
            typeof payload.code !== 'string'
            || typeof payload.installationId !== 'string'
            || payload.installationId.length < 20
            || payload.installationId.length > 100
        ) {
            return jsonResponse({ error: 'An active membership is required.' }, 403);
        }

        const accessResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/redeem_vip_access_code`, {
            method: 'POST',
            headers: getSupabaseHeaders(serviceRoleKey),
            body: JSON.stringify({
                p_code: payload.code.trim(),
                p_installation_id: payload.installationId,
            }),
        });
        if (!accessResponse.ok) {
            console.error('Unable to verify VIP access for the video library.');
            return jsonResponse({ error: 'Unable to verify VIP access.' }, 503);
        }

        const expiry: unknown = await accessResponse.json();
        if (typeof expiry !== 'string' || Date.parse(expiry) <= Date.now()) {
            return jsonResponse({ error: 'An active membership is required.' }, 403);
        }
    }

    const query = new URLSearchParams({
        select: 'id,title,description,object_path,cover_path,visibility,created_at',
        order: 'created_at.desc',
    });

    const headers = getSupabaseHeaders(serviceRoleKey);
    const videosResponse = await fetch(`${supabaseUrl}/rest/v1/vip_videos?${query}`, { headers });
    if (!videosResponse.ok) {
        console.error('Unable to load video metadata.');
        return jsonResponse({ error: 'Unable to load videos.' }, 503);
    }

    const videos: unknown = await videosResponse.json();
    if (!Array.isArray(videos)) {
        return jsonResponse({ error: 'Invalid video library response.' }, 502);
    }

    const result = [];
    for (const video of videos) {
        if (
            !isRecord(video)
            || typeof video.id !== 'string'
            || typeof video.title !== 'string'
            || typeof video.description !== 'string'
            || typeof video.object_path !== 'string'
            || (video.cover_path !== null && typeof video.cover_path !== 'string')
            || (video.visibility !== 'public' && video.visibility !== 'members')
            || typeof video.created_at !== 'string'
        ) {
            return jsonResponse({ error: 'Invalid video metadata.' }, 502);
        }

        const locked = payload.action === 'public' && video.visibility === 'members';
        let coverUrl: string | null = null;
        let url: string | null = null;
        try {
            if (locked && typeof video.cover_path === 'string') {
                coverUrl = await createSignedUrl(supabaseUrl, headers, video.cover_path);
            }
            if (!locked) {
                url = await createSignedUrl(supabaseUrl, headers, video.object_path);
            }
        } catch {
            console.error('Unable to prepare a video library object.');
            return jsonResponse({ error: 'Unable to prepare a video for playback.' }, 503);
        }

        result.push({
            id: video.id,
            title: locked ? 'Contenu réservé aux membres' : video.title,
            description: locked ? '' : video.description,
            visibility: video.visibility,
            createdAt: video.created_at,
            locked,
            coverUrl,
            url,
        });
    }

    return jsonResponse({ videos: result }, 200);
});
