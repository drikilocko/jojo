import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { LibraryVideo, loadVideoLibrary } from '../lib/videoLibrary';

interface VideoLibraryScreenProps {
    previewOnly?: boolean;
}

export const VideoLibraryScreen: React.FC<VideoLibraryScreenProps> = ({ previewOnly = false }) => {
    const { navigateTo, lockSite } = useShop();
    const [videos, setVideos] = useState<LibraryVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setVideos(await loadVideoLibrary(!previewOnly));
        } catch (loadError: unknown) {
            setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les vidéos.');
            setVideos([]);
        } finally {
            setLoading(false);
        }
    }, [previewOnly]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.eyebrow}>{previewOnly ? 'ESSAI GRATUIT' : 'ZONE VIDÉO PRIVÉE'}</Text>
                    <Text style={styles.title}>Vidéos {previewOnly ? 'publiques' : 'VIP'}</Text>
                    <Text style={styles.subtitle}>
                        {previewOnly
                            ? 'Découvre les vidéos que l’administrateur a rendues publiques.'
                            : 'Les vidéos privées sont réservées aux membres avec un accès actif.'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => previewOnly ? navigateTo('gate') : lockSite()}
                >
                    <Feather name="arrow-left" size={16} color="#ffffff" />
                    <Text style={styles.backButtonText}>{previewOnly ? 'Accueil' : 'Verrouiller'}</Text>
                </TouchableOpacity>
            </View>

            {!previewOnly && (
                <TouchableOpacity style={styles.renewButton} onPress={() => navigateTo('quick-payment')}>
                    <Text style={styles.renewText}>Renouveler mon accès</Text>
                    <Feather name="arrow-right" size={16} color="#ffffff" />
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.status}>
                    <ActivityIndicator size="large" color="#a78bfa" />
                    <Text style={styles.statusText}>Chargement des vidéos…</Text>
                </View>
            ) : error ? (
                <View style={styles.status}>
                    <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
                    <TouchableOpacity style={styles.renewButton} onPress={() => { void refresh(); }}>
                        <Text style={styles.renewText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : videos.length === 0 ? (
                <View style={styles.status}>
                    <Text style={styles.statusText}>
                        {previewOnly ? 'Aucune vidéo publique pour le moment.' : 'Aucune vidéo disponible.'}
                    </Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {videos.map((video) => (
                        <View key={video.id} style={styles.card}>
                            {Platform.OS === 'web'
                                ? React.createElement('video', {
                                    src: video.url,
                                    controls: true,
                                    playsInline: true,
                                    preload: 'metadata',
                                    style: {
                                        display: 'block',
                                        width: '100%',
                                        aspectRatio: '9 / 16',
                                        objectFit: 'cover',
                                        backgroundColor: '#020617',
                                        borderRadius: 10,
                                    },
                                })
                                : <Text style={styles.statusText}>La lecture vidéo est disponible sur le site web.</Text>}
                            <Text style={styles.videoTitle}>{video.title}</Text>
                            {!!video.description && <Text style={styles.description}>{video.description}</Text>}
                            {!previewOnly && (
                                <Text style={styles.visibility}>
                                    {video.visibility === 'public' ? 'PUBLIC' : 'MEMBRES'}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    page: {
        flexGrow: 1,
        minHeight: '100%',
        backgroundColor: '#07090f',
        padding: 20,
        gap: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
    },
    headerText: {
        flex: 1,
        minWidth: 240,
        gap: 6,
    },
    eyebrow: {
        color: '#a78bfa',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '800',
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
        lineHeight: 21,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 9,
        backgroundColor: '#1e293b',
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    renewButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 9,
        backgroundColor: '#6d5ce8',
    },
    renewText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    status: {
        minHeight: 180,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    statusText: {
        color: '#cbd5e1',
        fontSize: 14,
        textAlign: 'center',
    },
    error: {
        color: '#fecaca',
        backgroundColor: '#451a1a',
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    card: {
        flex: 1,
        flexBasis: 250,
        maxWidth: 340,
        minWidth: 220,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#111827',
        gap: 10,
    },
    videoTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    description: {
        color: '#cbd5e1',
        fontSize: 13,
        lineHeight: 19,
    },
    visibility: {
        color: '#a78bfa',
        fontSize: 11,
        fontWeight: '800',
    },
});
