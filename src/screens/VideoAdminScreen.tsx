import React, { useEffect, useRef, useState } from 'react';
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
import { supabase, supabasePublishableKey, supabaseUrl } from '../lib/supabase';

type VideoVisibility = 'public' | 'members';

interface AdminVideo {
    id: string;
    title: string;
    description: string;
    objectPath: string;
    coverPath: string | null;
    visibility: VideoVisibility;
    createdAt: string;
}

interface UploadProgress {
    transferredBytes: number;
    totalBytes: number;
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

function formatMegabytes(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
}

async function fetchAdminVideos(): Promise<AdminVideo[]> {
    const { data, error } = await supabase
        .from('vip_videos')
        .select('id,title,description,object_path,cover_path,visibility,created_at')
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
            || (row.cover_path !== null && typeof row.cover_path !== 'string')
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
            coverPath: row.cover_path,
            visibility: row.visibility,
            createdAt: row.created_at,
        };
    });
}

function createBlurredVideoCover(source: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const sourceUrl = URL.createObjectURL(source);
        let settled = false;
        const timeout = window.setTimeout(() => {
            fail('Impossible de créer l’aperçu de cette vidéo.');
        }, 30000);

        const cleanup = () => {
            window.clearTimeout(timeout);
            video.onloadeddata = null;
            video.onerror = null;
            video.removeAttribute('src');
            video.load();
            URL.revokeObjectURL(sourceUrl);
        };

        const fail = (message: string) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error(message));
        };

        video.onloadeddata = () => {
            try {
                if (!video.videoWidth || !video.videoHeight) {
                    fail('La vidéo ne contient aucune image exploitable pour sa couverture.');
                    return;
                }

                const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
                canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
                const context = canvas.getContext('2d');
                if (!context) {
                    fail('Le navigateur ne peut pas préparer la couverture vidéo.');
                    return;
                }

                context.fillStyle = '#0b1220';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.filter = 'blur(12px)';
                if (context.filter !== 'blur(12px)') {
                    fail('Ce navigateur ne prend pas en charge la création de couvertures floutées.');
                    return;
                }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                context.filter = 'none';
                canvas.toBlob((blob) => {
                    if (!blob) {
                        fail('Impossible de créer la couverture floutée.');
                        return;
                    }

                    if (settled) return;
                    settled = true;
                    cleanup();
                    resolve(new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.82);
            } catch (error: unknown) {
                fail(errorText(error));
            }
        };
        video.onerror = () => fail('Le navigateur ne peut pas lire cette vidéo pour créer sa couverture.');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.src = sourceUrl;
        video.load();
    });
}

async function uploadVideoWithProgress(
    file: Blob,
    objectPath: string,
    onProgress: (transferredBytes: number, totalBytes: number) => void
): Promise<void> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error('La session administrateur a expiré. Reconnecte-toi.');

    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `${supabaseUrl}/storage/v1/object/vip-videos/${encodedPath}`);
        request.setRequestHeader('apikey', supabasePublishableKey);
        request.setRequestHeader('Authorization', `Bearer ${data.session.access_token}`);
        request.setRequestHeader('Content-Type', file.type);
        request.setRequestHeader('cache-control', 'max-age=3600');
        request.setRequestHeader('x-upsert', 'false');
        request.upload.onprogress = (event) => {
            onProgress(event.loaded, event.lengthComputable ? event.total : file.size);
        };
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                onProgress(file.size, file.size);
                resolve();
                return;
            }

            let message = `Échec de l’envoi vidéo (HTTP ${request.status}).`;
            try {
                const response: unknown = JSON.parse(request.responseText);
                if (isRecord(response) && typeof response.message === 'string') {
                    message = response.message;
                } else if (isRecord(response) && typeof response.error === 'string') {
                    message = response.error;
                }
            } catch {
                // Keep the HTTP error when the storage response is not JSON.
            }
            reject(new Error(message));
        };
        request.onerror = () => reject(new Error('Connexion interrompue pendant l’envoi de la vidéo.'));
        request.onabort = () => reject(new Error('Envoi de la vidéo annulé.'));
        request.send(file);
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
    const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
    const [generatingCover, setGeneratingCover] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const coverRequestId = useRef(0);

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
            if (file.size === 0) {
                setError('Le fichier vidéo est vide.');
                return;
            }
            if (file.size > MAX_VIDEO_SIZE) {
                setError('La vidéo dépasse la limite de 100 Mo.');
                return;
            }
            const requestId = ++coverRequestId.current;
            setSelectedFile(file);
            setSelectedCoverFile(null);
            setGeneratingCover(true);
            setError(null);
            void createBlurredVideoCover(file)
                .then((cover) => {
                    if (coverRequestId.current === requestId) setSelectedCoverFile(cover);
                })
                .catch((coverError: unknown) => {
                    if (coverRequestId.current === requestId) setError(errorText(coverError));
                })
                .finally(() => {
                    if (coverRequestId.current === requestId) setGeneratingCover(false);
                });
        };
        input.click();
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedCoverFile || !title.trim()) {
            setError('Choisis une vidéo, attends la préparation de sa couverture et saisis un titre.');
            return;
        }

        setBusy(true);
        setError(null);
        const totalBytes = selectedFile.size + selectedCoverFile.size;
        setUploadProgress({ transferredBytes: 0, totalBytes });
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'video';
        const objectPath = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}/${safeName}`;
        const coverPath = `${objectPath}.cover.jpg`;
        const uploadedPaths: string[] = [];
        let metadataSaved = false;

        try {
            await uploadVideoWithProgress(selectedFile, objectPath, (transferredBytes) => {
                setUploadProgress({ transferredBytes, totalBytes });
            });
            uploadedPaths.push(objectPath);
            await uploadVideoWithProgress(selectedCoverFile, coverPath, (transferredBytes) => {
                setUploadProgress({
                    transferredBytes: selectedFile.size + transferredBytes,
                    totalBytes,
                });
            });
            uploadedPaths.push(coverPath);

            const { error: metadataError } = await supabase.from('vip_videos').insert({
                title: title.trim(),
                description: description.trim(),
                object_path: objectPath,
                cover_path: coverPath,
                visibility,
            });
            if (metadataError) throw metadataError;
            metadataSaved = true;

            await refreshVideos();
            setTitle('');
            setDescription('');
            setSelectedFile(null);
            setSelectedCoverFile(null);
            setVisibility('members');
        } catch (uploadError: unknown) {
            let message = errorText(uploadError);
            if (!metadataSaved && uploadedPaths.length > 0) {
                const { error: cleanupError } = await supabase.storage
                    .from('vip-videos')
                    .remove(uploadedPaths);
                if (cleanupError) {
                    console.error('Unable to remove orphaned video upload files.', cleanupError);
                    message += ' Les fichiers vidéo temporaires n’ont pas pu être supprimés.';
                }
            }
            setError(message);
        } finally {
            setBusy(false);
            setUploadProgress(null);
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
                .remove([video.objectPath, ...(video.coverPath ? [video.coverPath] : [])]);
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
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handlePickVideo}
                    disabled={busy || generatingCover}
                >
                    <Text style={styles.secondaryButtonText}>
                        {selectedFile ? selectedFile.name : 'Choisir une vidéo (100 Mo max.)'}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.muted}>
                    {generatingCover
                        ? 'Préparation de la couverture floutée…'
                        : selectedCoverFile
                            ? 'Couverture floutée prête.'
                            : 'Une couverture floutée sera créée automatiquement.'}
                </Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleUpload}
                    disabled={busy || generatingCover}
                >
                    {busy
                        ? <ActivityIndicator color="#ffffff" />
                        : <Text style={styles.primaryButtonText}>Envoyer la vidéo</Text>}
                </TouchableOpacity>
                {uploadProgress && (
                    <View style={styles.uploadProgress}>
                        <View style={styles.progressLabelRow}>
                            <Text style={styles.muted}>
                                {uploadProgress.transferredBytes >= uploadProgress.totalBytes
                                    ? 'Envoi terminé, enregistrement…'
                                    : `Envoi des fichiers · ${Math.floor((uploadProgress.transferredBytes / uploadProgress.totalBytes) * 100)} %`}
                            </Text>
                            <Text style={styles.progressAmount}>
                                {formatMegabytes(uploadProgress.transferredBytes)} / {formatMegabytes(uploadProgress.totalBytes)} Mo
                            </Text>
                        </View>
                        <View
                            style={styles.progressTrack}
                            accessibilityRole="progressbar"
                            accessibilityValue={{
                                min: 0,
                                max: 100,
                                now: Math.floor((uploadProgress.transferredBytes / uploadProgress.totalBytes) * 100),
                            }}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(100, (uploadProgress.transferredBytes / uploadProgress.totalBytes) * 100)}%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                )}
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
    uploadProgress: {
        gap: 8,
        marginTop: 4,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6,
    },
    progressAmount: {
        color: '#c4b5fd',
        fontSize: 12,
        fontWeight: '600',
    },
    progressTrack: {
        height: 9,
        overflow: 'hidden',
        borderRadius: 999,
        backgroundColor: '#263244',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#8b5cf6',
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
