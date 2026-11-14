import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    useWindowDimensions,
    ImageBackground,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LocalizedText as Text, useLanguage } from '../context/LanguageContext';
import { useShop } from '../context/ShopContext';
import { getPaidAccessExpiry } from '../lib/access';
import { VIDEO_BG_IMAGE } from '../data/media';

interface VideoItem {
    id: string;
    title: string;
    duration: string;
    views: string;
    category: string;
}

const MOCK_VIDEOS: VideoItem[] = [
    { id: '1', title: 'Session Exclusive #01', duration: '02:45', views: '3.8k', category: 'VIP' },
    { id: '2', title: 'Contenu Privé #02', duration: '01:30', views: '2.1k', category: 'PREMIUM' },
    { id: '3', title: 'Backstage Live #03', duration: '04:12', views: '5.4k', category: 'DIRECT' },
    { id: '4', title: 'Masterclass Part 1', duration: '03:15', views: '1.9k', category: 'PRO' },
    { id: '5', title: 'Session Studio #05', duration: '02:05', views: '4.2k', category: 'VIP' },
    { id: '6', title: 'Archive Spéciale #06', duration: '05:40', views: '6.7k', category: 'EXCLUSIF' },
    { id: '7', title: 'Secret Drop #07', duration: '01:50', views: '3.1k', category: 'VIP' },
    { id: '8', title: 'Live Streaming #08', duration: '03:55', views: '2.8k', category: 'DIRECT' },
    { id: '9', title: 'Séance Complète #09', duration: '06:20', views: '7.3k', category: 'ULTIME' },
];

export const VideoScreen: React.FC = () => {
    const { navigateTo, lockSite } = useShop();
    const { language } = useLanguage();
    const { width } = useWindowDimensions();

    const [daysLeft, setDaysLeft] = useState<number>(30);
    const [isExpired, setIsExpired] = useState(true);
    const [accessChecked, setAccessChecked] = useState(false);

    useEffect(() => {
        let mounted = true;
        getPaidAccessExpiry()
            .then((expiry) => {
                if (!mounted || expiry === null) return;
                setDaysLeft(Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
                setIsExpired(false);
            })
            .catch((accessError: unknown) => {
                console.error('Unable to verify saved PayDunya access.', accessError);
                if (mounted) setIsExpired(true);
            })
            .finally(() => {
                if (mounted) setAccessChecked(true);
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Format mm:ss
    const formatTime = (totalSec: number) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isMobile = width < 768;
    const columns = width < 560 ? 2 : width < 1050 ? 3 : 4;
    const gridGap = 12;
    const gridWidth = Math.max(0, Math.min(width, 1100) - 32);
    const cardWidth = (gridWidth - gridGap * (columns - 1)) / columns;

    if (!accessChecked) {
        return (
            <View style={styles.expiredContainer}>
                <ActivityIndicator size="large" color="#a78bfa" />
            </View>
        );
    }

    if (isExpired) {
        return (
            <View style={styles.expiredContainer}>
                <View style={styles.expiredCard}>
                    <View style={styles.expiredIconRing}>
                        <Feather name="clock" size={32} color="#f87171" />
                    </View>
                    <Text style={styles.expiredTitle}>Temps d'accès écoulé !</Text>
                    <Text style={styles.expiredDesc}>
                        Votre abonnement mensuel de 30 jours est arrivé à expiration. Renouvelez votre pass pour continuer à visionner.
                    </Text>
                    <TouchableOpacity
                        style={styles.rechargeBtn}
                        onPress={() => navigateTo('quick-payment')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#8b5cf6', '#6366f1']}
                            style={styles.rechargeGradient}
                        >
                            <Text style={styles.rechargeBtnText}>Renouveler mon abonnement</Text>
                            <Feather name="arrow-right" size={18} color="#ffffff" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={lockSite}
                    >
                        <Text style={styles.logoutBtnText}>Quitter vers l'accueil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ImageBackground
            source={VIDEO_BG_IMAGE}
            blurRadius={Platform.OS === 'web' ? 20 : 25}
            style={styles.container}
            resizeMode="cover"
        >
            <LinearGradient
                colors={['rgba(7, 9, 15, 0.72)', 'rgba(7, 9, 15, 0.86)', '#07090f']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header / Top Bar avec Countdown Timer */}
            <ImageBackground
                source={VIDEO_BG_IMAGE}
                blurRadius={Platform.OS === 'web' ? 14 : 18}
                style={styles.topBar}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.85)', 'rgba(7, 9, 15, 0.92)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.topBarLeft}>
                    <View style={styles.statusLiveDot} />
                    <Text style={styles.brandText}>ZONE VIDÉO PRIVÉE</Text>
                </View>

                {/* Badge Abonnement 50$/mois */}
                <View style={styles.timerBadge}>
                    <Feather name="check-circle" size={14} color="#34d399" />
                    {!isMobile && <Text style={styles.timerLabel}>Abonnement 50 $ / mois :</Text>}
                    <Text style={styles.timerValue}>
                        {isMobile
                            ? `${daysLeft}${language === 'en' ? 'd' : 'j'}`
                            : language === 'en' ? `${daysLeft} days left` : `${daysLeft}j restants`}
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.topBarRight}>
                    <TouchableOpacity
                        style={styles.addTimeBtn}
                        onPress={() => navigateTo('quick-payment')}
                        activeOpacity={0.8}
                    >
                        <Feather name="refresh-cw" size={13} color="#a78bfa" />
                        <Text style={styles.addTimeText}>{isMobile ? 'Payer' : 'Renouveler'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.lockBtn}
                        onPress={lockSite}
                        activeOpacity={0.8}
                    >
                        <Feather name="log-out" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
            </ImageBackground>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.tagBadge}>
                        <Feather name="lock" size={12} color="#a78bfa" />
                        <Text style={styles.tagBadgeText}>FLUX SÉCURISÉ & CHIFFRÉ</Text>
                    </View>
                    <Text style={styles.title}>Vidéos Exclusives</Text>
                    <Text style={styles.subtitle}>
                        Grille interactive en format portrait (9:16). Les serveurs d'encodage sont en cours de mise à jour.
                    </Text>
                </View>

                {/* GRILLE DE 3 COLONNES EN PORTRAIT */}
                <View style={[styles.gridContainer, { columnGap: gridGap }]}>
                    {MOCK_VIDEOS.map((item) => (
                        <View key={item.id} style={[styles.videoCard, { width: cardWidth }]}>
                            {/* Écran portrait vidéo */}
                            <View style={styles.videoPortraitWrapper}>
                                <LinearGradient
                                    colors={['#1e293b', '#0f172a', '#020617']}
                                    style={styles.videoPlaceholder}
                                >
                                    {/* Scanlines / badge en haut */}
                                    <View style={styles.videoTopInfo}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{item.category}</Text>
                                        </View>
                                        <View style={styles.durationPill}>
                                            <Text style={styles.durationText}>{item.duration}</Text>
                                        </View>
                                    </View>

                                    {/* Centre : Vidéo indisponible */}
                                    <View style={styles.unavailableBox}>
                                        <View style={styles.iconCircle}>
                                            <Feather name="video-off" size={24} color="#f87171" />
                                        </View>
                                        <Text style={styles.unavailableText}>Vidéo indisponible</Text>
                                        <Text style={styles.unavailableSub}>En maintenance</Text>
                                    </View>

                                    {/* Bas du portrait */}
                                    <View style={styles.videoBottomInfo}>
                                        <Text style={styles.videoTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <View style={styles.viewsRow}>
                                            <Feather name="eye" size={11} color="#64748b" />
                                            <Text style={styles.viewsText}>{item.views}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bandeau d'information tarif */}
                <View style={styles.pricingNotice}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#a78bfa" />
                    <Text style={styles.pricingNoticeText}>
                        Abonnement VIP Actif : <Text style={{ fontWeight: '800', color: '#ffffff' }}>Accès illimité aux vidéos</Text> pendant toute la durée de validité de votre pass.
                    </Text>
                </View>

                {/* Footer élégant de la page vidéo */}
                <ImageBackground
                    source={VIDEO_BG_IMAGE}
                    blurRadius={Platform.OS === 'web' ? 14 : 18}
                    style={styles.videoFooter}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['rgba(15, 23, 42, 0.85)', 'rgba(5, 7, 15, 0.95)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.videoFooterInner}>
                        <View style={styles.videoFooterBrandRow}>
                            <Feather name="shield" size={16} color="#a78bfa" />
                            <Text style={styles.videoFooterBrandTitle}>Zone de Papy • Espace Vidéo VIP</Text>
                        </View>
                        <Text style={styles.videoFooterDesc}>
                            Vidéos privées et confidentielles • Droits réservés aux membres VIP
                        </Text>
                        <View style={styles.videoFooterActions}>
                            <TouchableOpacity
                                style={styles.footerShopBtn}
                                onPress={() => navigateTo('shop')}
                                activeOpacity={0.8}
                            >
                                <Feather name="shopping-bag" size={13} color="#a78bfa" />
                                <Text style={styles.footerShopText}>Retourner à la boutique</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.footerLockBtn}
                                onPress={lockSite}
                                activeOpacity={0.8}
                            >
                                <Feather name="lock" size={13} color="#94a3b8" />
                                <Text style={styles.footerLockText}>Verrouiller la session</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>
            </ScrollView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07090f',
        overflow: 'hidden',
    },
    topBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 52 : 36,
        paddingBottom: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 1,
    },
    statusLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    brandText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
        flexShrink: 1,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.35)',
    },
    timerLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '600',
    },
    timerValue: {
        color: '#34d399',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    addTimeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    addTimeText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '700',
    },
    lockBtn: {
        padding: 6,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 60,
        maxWidth: 1100,
        width: '100%',
        alignSelf: 'center',
    },
    headerSection: {
        marginVertical: 18,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    tagBadgeText: {
        color: '#a78bfa',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 16,
        marginTop: 10,
    },
    videoCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0f172a',
    },
    videoPortraitWrapper: {
        aspectRatio: 9 / 16,
        width: '100%',
    },
    videoPlaceholder: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 10,
    },
    videoTopInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    categoryText: {
        color: '#a78bfa',
        fontSize: 10,
        fontWeight: '800',
    },
    durationPill: {
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    durationText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
    },
    unavailableBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    unavailableText: {
        color: '#f87171',
        fontSize: 13,
        fontWeight: '800',
        textAlign: 'center',
    },
    unavailableSub: {
        color: '#64748b',
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
    videoBottomInfo: {
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        padding: 8,
        borderRadius: 10,
    },
    videoTitle: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
    },
    viewsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewsText: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '600',
    },
    pricingNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.45)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.25)',
        borderRadius: 14,
        padding: 14,
        marginTop: 26,
    },
    pricingNoticeText: {
        color: '#cbd5e1',
        fontSize: 13,
        flex: 1,
    },
    expiredContainer: {
        flex: 1,
        backgroundColor: '#07090f',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    expiredCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#0f172a',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        padding: 28,
        alignItems: 'center',
    },
    expiredIconRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    expiredTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    expiredDesc: {
        color: '#94a3b8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
    },
    rechargeBtn: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 12,
    },
    rechargeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
    },
    rechargeBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    logoutBtn: {
        paddingVertical: 10,
    },
    logoutBtnText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    videoFooter: {
        marginTop: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    videoFooterInner: {
        padding: 24,
        alignItems: 'center',
    },
    videoFooterBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    videoFooterBrandTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    videoFooterDesc: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
    },
    videoFooterActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    footerShopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    footerShopText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '700',
    },
    footerLockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    footerLockText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '600',
    },
});
