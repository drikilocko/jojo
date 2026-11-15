import { getSavedAccessCode, getInstallationId } from './access';
import { supabasePublishableKey, supabaseUrl } from './supabase';

export interface LibraryVideo {
    id: string;
    title: string;
    description: string;
    visibility: 'public' | 'members';
    createdAt: string;
    locked: boolean;
    coverUrl: string | null;
    url: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function loadVideoLibrary(includeMembers: boolean): Promise<LibraryVideo[]> {
    const body: Record<string, string> = { action: includeMembers ? 'members' : 'public' };
    if (includeMembers) {
        const [savedCode, installationId] = await Promise.all([
            getSavedAccessCode(),
            getInstallationId(),
        ]);
        if (!savedCode) {
            throw new Error('Un code d’accès actif est nécessaire pour voir les vidéos privées.');
        }
        body.code = savedCode.code;
        body.installationId = installationId;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/video-library`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: supabasePublishableKey,
            Authorization: `Bearer ${supabasePublishableKey}`,
        },
        body: JSON.stringify(body),
    });

    let responseBody: unknown;
    try {
        responseBody = await response.json();
    } catch {
        throw new Error(`Le service vidéo a renvoyé une réponse invalide (HTTP ${response.status}).`);
    }

    if (!response.ok) {
        const message = isRecord(responseBody) && typeof responseBody.error === 'string'
            ? responseBody.error
            : `Impossible de charger les vidéos (HTTP ${response.status}).`;
        throw new Error(message);
    }

    if (!isRecord(responseBody) || !Array.isArray(responseBody.videos)) {
        throw new Error('Le service vidéo a renvoyé une bibliothèque invalide.');
    }

    return responseBody.videos.map((video): LibraryVideo => {
        if (
            !isRecord(video)
            || typeof video.id !== 'string'
            || typeof video.title !== 'string'
            || typeof video.description !== 'string'
            || (video.visibility !== 'public' && video.visibility !== 'members')
            || typeof video.createdAt !== 'string'
            || typeof video.locked !== 'boolean'
            || (video.coverUrl !== null && typeof video.coverUrl !== 'string')
            || (video.url !== null && typeof video.url !== 'string')
            || (video.locked && (video.visibility !== 'members' || video.url !== null))
            || (!video.locked && typeof video.url !== 'string')
        ) {
            throw new Error('Une vidéo contient des informations invalides.');
        }
        return {
            id: video.id,
            title: video.title,
            description: video.description,
            visibility: video.visibility,
            createdAt: video.createdAt,
            locked: video.locked,
            coverUrl: video.coverUrl,
            url: video.url,
        };
    });
}
