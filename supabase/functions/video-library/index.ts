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
        select: 'id,title,description,object_path,visibility,created_at',
        order: 'created_at.desc',
    });
    if (payload.action === 'public') query.set('visibility', 'eq.public');

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
        if (!isRecord(video) || typeof video.object_path !== 'string') {
            return jsonResponse({ error: 'Invalid video metadata.' }, 502);
        }

        const objectPath = video.object_path.split('/').map(encodeURIComponent).join('/');
        const signedResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/sign/vip-videos/${objectPath}`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ expiresIn: 3600 }),
            },
        );
        if (!signedResponse.ok) {
            console.error('Unable to create a signed video URL.');
            return jsonResponse({ error: 'Unable to prepare a video for playback.' }, 503);
        }

        const signedData: unknown = await signedResponse.json();
        if (!isRecord(signedData) || typeof signedData.signedURL !== 'string') {
            return jsonResponse({ error: 'Invalid signed video response.' }, 502);
        }

        const signedPath = signedData.signedURL;
        const url = signedPath.startsWith('http')
            ? signedPath
            : signedPath.startsWith('/storage/v1/')
                ? `${supabaseUrl}${signedPath}`
                : `${supabaseUrl}/storage/v1${signedPath.startsWith('/') ? signedPath : `/${signedPath}`}`;

        result.push({
            id: video.id,
            title: video.title,
            description: video.description,
            visibility: video.visibility,
            createdAt: video.created_at,
            url,
        });
    }

    return jsonResponse({ videos: result }, 200);
});
