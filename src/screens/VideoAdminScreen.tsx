import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { supabase } from '../lib/supabase';

type VideoVisibility = 'public' | 'members';

interface AdminVideo {
    id: string;
    title: string;
    description: string;
    objectPath: string;
    visibility: VideoVisibility;
    createdAt: string;
}

const ADMIN_EMAIL = 'jojo@gmail.com';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (isRecord(error) && typeof error.message === 'string') return error.message;
    return 'Une erreur inattendue est survenue.';
}

async function fetchAdminVideos(): Promise<AdminVideo[]> {
    const { data, error } = await supabase
        .from('vip_videos')
        .select('id,title,description,object_path,visibility,created_at')
        .order('created_at', { ascending: false });
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Réponse vidéo invalide.');

    return data.map((row): AdminVideo => {
        if (
            !isRecord(row)
            || typeof row.id !== 'string'
            || typeof row.title !== 'string'
            || typeof row.description !== 'string'
            || typeof row.object_path !== 'string'
            || (row.visibility !== 'public' && row.visibility !== 'members')
            || typeof row.created_at !== 'string'
        ) {
            throw new Error('Une vidéo contient des informations invalides.');
        }
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            objectPath: row.object_path,
            visibility: row.visibility,
            createdAt: row.created_at,
        };
    });
}

export const VideoAdminScreen: React.FC = () => {
    const { navigateTo } = useShop();
    const [email, setEmail] = useState(ADMIN_EMAIL);
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videos, setVideos] = useState<AdminVideo[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<VideoVisibility>('members');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const refreshVideos = async () => {
        const rows = await fetchAdminVideos();
        setVideos(rows);
    };

    const verifyAdmin = async (userId: string) => {
        const { data, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();
        if (profileError) throw profileError;
        if (!data || data.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Ce compte n’a pas les droits administrateur.');
        }
        setIsAdmin(true);
        await refreshVideos();
    };

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession()
            .then(async ({ data, error: sessionError }) => {
                if (sessionError) throw sessionError;
                if (data.session) await verifyAdmin(data.session.user.id);
            })
            .catch((sessionError: unknown) => {
                if (mounted) setError(errorText(sessionError));
            })
            .finally(() => {
                if (mounted) setCheckingSession(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const handleLogin = async () => {
        setBusy(true);
        setError(null);
        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (loginError) throw loginError;
            if (!data.user) throw new Error('Connexion administrateur impossible.');
            await verifyAdmin(data.user.id);
        } catch (loginError: unknown) {
            setError(errorText(loginError));
        } finally {
            setBusy(false);
            setCheckingSession(false);
        }
    };

    const handleLogout = async () => {
        setBusy(true);
        setError(null);
        try {
            const { error: logoutError } = await supabase.auth.signOut();
            if (logoutError) throw logoutError;
            setIsAdmin(false);
            setVideos([]);
            setPassword('');
            navigateTo('gate');
        } catch (logoutError: unknown) {
            setError(errorText(logoutError));
        } finally {
            setBusy(false);
        }
    };

    const handlePickVideo = () => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') {
            setError('L’upload vidéo est disponible depuis le site web.');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/webm,video/quicktime';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('video/')) {
                setError('Choisis un fichier vidéo MP4, WebM ou QuickTime.');
                return;
            }
            if (file.size > MAX_VIDEO_SIZE) {
                setError('La vidéo dépasse la limite de 100 Mo.');
                return;
            }
            setSelectedFile(file);
            setError(null);
        };
        input.click();
    };

    const handleUpload = async () => {
        if (!selectedFile || !title.trim()) {
            setError('Choisis une vidéo et saisis un titre.');
            return;
        }

        setBusy(true);
        setError(null);
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'video';
        const objectPath = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}/${safeName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('vip-videos')
                .upload(objectPath, selectedFile, {
                    cacheControl: '3600',
                    contentType: selectedFile.type,
                    upsert: false,
                });
            if (uploadError) throw uploadError;

            const { error: metadataError } = await supabase.from('vip_videos').insert({
                title: title.trim(),
                description: description.trim(),
                object_path: objectPath,
                visibility,
            });
            if (metadataError) {
                const { error: cleanupError } = await supabase.storage
                    .from('vip-videos')
                    .remove([objectPath]);
                if (cleanupError) {
                    console.error('Unable to remove an orphaned video upload.', cleanupError);
                    throw new Error(`${metadataError.message} Le fichier temporaire n’a pas pu être supprimé.`);
                }
                throw metadataError;
            }

            await refreshVideos();
            setTitle('');
            setDescription('');
            setSelectedFile(null);
            setVisibility('members');
        } catch (uploadError: unknown) {
            setError(errorText(uploadError));
        } finally {
            setBusy(false);
        }
    };

    const handleVisibilityChange = async (video: AdminVideo, nextVisibility: VideoVisibility) => {
        setBusy(true);
        setError(null);
        try {
            const { error: updateError } = await supabase
                .from('vip_videos')
                .update({ visibility: nextVisibility })
                .eq('id', video.id);
            if (updateError) throw updateError;
            await refreshVideos();
        } catch (updateError: unknown) {
            setError(errorText(updateError));
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (video: AdminVideo) => {
        if (Platform.OS === 'web' && !window.confirm(`Supprimer « ${video.title} » ?`)) return;
        setBusy(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('vip_videos')
                .delete()
                .eq('id', video.id);
            if (deleteError) throw deleteError;

            const { error: storageError } = await supabase.storage
                .from('vip-videos')
                .remove([video.objectPath]);
            if (storageError) {
                setError(`La vidéo a été retirée de la bibliothèque, mais son fichier n’a pas pu être supprimé : ${storageError.message}`);
            }
            await refreshVideos();
        } catch (deleteError: unknown) {
            setError(errorText(deleteError));
        } finally {
            setBusy(false);
        }
    };

    if (checkingSession) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#a78bfa" />
                <Text style={styles.muted}>Vérification de la session admin…</Text>
            </View>
        );
    }

    if (!isAdmin) {
        return (
            <ScrollView contentContainerStyle={styles.loginPage}>
                <View style={styles.loginCard}>
                    <Feather name="shield" size={30} color="#a78bfa" />
                    <Text style={styles.heading}>Administration vidéo</Text>
                    <Text style={styles.muted}>Connecte-toi avec le compte administrateur Supabase.</Text>
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        placeholder="jojo@gmail.com"
                        placeholderTextColor="#64748b"
                    />
                    <Text style={styles.label}>Mot de passe</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="Mot de passe administrateur"
                        placeholderTextColor="#64748b"
                        onSubmitEditing={handleLogin}
                    />
                    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
                    <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={busy}>
                        {busy
                            ? <ActivityIndicator color="#ffffff" />
                            : <Text style={styles.primaryButtonText}>Se connecter</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => navigateTo('gate')}>
                        <Text style={styles.linkText}>Retour à l’accueil</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.heading}>Gestion des vidéos</Text>
                    <Text style={styles.muted}>Les fichiers sont privés dans le stockage; seules les vidéos publiques sont visibles sans pass.</Text>
                </View>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout} disabled={busy}>
                    <Text style={styles.secondaryButtonText}>Déconnexion</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Ajouter une vidéo</Text>
                <Text style={styles.label}>Titre</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={120}
                    placeholder="Titre de la vidéo"
                    placeholderTextColor="#64748b"
                />
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                    placeholder="Description"
                    placeholderTextColor="#64748b"
                />
                <View style={styles.visibilityRow}>
                    {(['public', 'members'] as const).map((value) => (
                        <TouchableOpacity
                            key={value}
                            style={[styles.visibilityButton, visibility === value && styles.visibilitySelected]}
                            onPress={() => setVisibility(value)}
                        >
                            <Text style={styles.visibilityText}>
                                {value === 'public' ? 'Public · essai gratuit' : 'Privé · membres'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.secondaryButton} onPress={handlePickVideo}>
                    <Text style={styles.secondaryButtonText}>
                        {selectedFile ? selectedFile.name : 'Choisir une vidéo (100 Mo max.)'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleUpload} disabled={busy}>
                    {busy
                        ? <ActivityIndicator color="#ffffff" />
                        : <Text style={styles.primaryButtonText}>Envoyer la vidéo</Text>}
                </TouchableOpacity>
            </View>

            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

            <View style={styles.card}>
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>Bibliothèque ({videos.length})</Text>
                    <TouchableOpacity onPress={() => { void refreshVideos().catch((loadError: unknown) => setError(errorText(loadError))); }}>
                        <Text style={styles.linkText}>Actualiser</Text>
                    </TouchableOpacity>
                </View>
                {videos.length === 0
                    ? <Text style={styles.muted}>Aucune vidéo publiée.</Text>
                    : videos.map((video) => (
                        <View key={video.id} style={styles.videoRow}>
                            <View style={styles.videoDetails}>
                                <Text style={styles.videoTitle}>{video.title}</Text>
                                {!!video.description && <Text style={styles.muted}>{video.description}</Text>}
                                <Text style={styles.visibilityStatus}>
                                    {video.visibility === 'public' ? 'Visible en essai gratuit' : 'Réservée aux membres'}
                                </Text>
                            </View>
                            <View style={styles.rowActions}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={() => handleVisibilityChange(video, video.visibility === 'public' ? 'members' : 'public')}
                                    disabled={busy}
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        {video.visibility === 'public' ? 'Rendre privée' : 'Rendre publique'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(video)}
                                    disabled={busy}
                                    accessibilityLabel={`Supprimer ${video.title}`}
                                >
                                    <Feather name="trash-2" size={16} color="#fecaca" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    page: {
        flexGrow: 1,
        backgroundColor: '#07090f',
        padding: 24,
        gap: 18,
    },
    loginPage: {
        flexGrow: 1,
        minHeight: '100%',
        backgroundColor: '#07090f',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    centered: {
        flex: 1,
        backgroundColor: '#07090f',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loginCard: {
        width: '100%',
        maxWidth: 440,
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#111827',
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    heading: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 8,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    muted: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 20,
    },
    label: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
    input: {
        color: '#ffffff',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#0b1220',
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    descriptionInput: {
        minHeight: 96,
    },
    card: {
        padding: 18,
        borderRadius: 14,
        backgroundColor: '#111827',
        gap: 12,
    },
    primaryButton: {
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: '#6d5ce8',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryButton: {
        minHeight: 40,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#475569',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    secondaryButtonText: {
        color: '#e2e8f0',
        fontSize: 13,
        fontWeight: '600',
    },
    linkButton: {
        alignItems: 'center',
        padding: 8,
    },
    linkText: {
        color: '#c4b5fd',
        fontSize: 13,
        fontWeight: '600',
    },
    error: {
        color: '#fecaca',
        backgroundColor: '#451a1a',
        borderRadius: 8,
        padding: 12,
    },
    visibilityRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    visibilityButton: {
        borderWidth: 1,
        borderColor: '#475569',
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    visibilitySelected: {
        borderColor: '#a78bfa',
        backgroundColor: '#2e2151',
    },
    visibilityText: {
        color: '#e2e8f0',
        fontSize: 13,
        fontWeight: '600',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    videoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#263244',
    },
    videoDetails: {
        flex: 1,
        minWidth: 200,
        gap: 4,
    },
    videoTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    visibilityStatus: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '600',
    },
    rowActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 9,
        backgroundColor: '#7f1d1d',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
