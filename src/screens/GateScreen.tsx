import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { getPaidAccessExpiry, getPendingPayDunyaPayment } from '../lib/access';
import { GATE_BG_IMAGE } from '../data/media';

const { height } = Dimensions.get('window');

export const GateScreen: React.FC = () => {
    const { navigateTo } = useShop();
    const [error, setError] = useState<string | null>(null);
    const [hasPaidAccess, setHasPaidAccess] = useState(false);
    const [hasPendingPayment, setHasPendingPayment] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    useEffect(() => {
        let mounted = true;
        Promise.all([getPaidAccessExpiry(), getPendingPayDunyaPayment()])
            .then(([expiry, pendingPayment]) => {
                if (!mounted) return;
                setHasPaidAccess(expiry !== null);
                setHasPendingPayment(pendingPayment !== null);
            })
            .catch((accessError: unknown) => {
                console.error('Unable to verify saved PayDunya access.', accessError);
                if (mounted) setError('Impossible de vérifier votre accès enregistré.');
            })
            .finally(() => {
                if (mounted) setCheckingAccess(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const handleAccess = () => {
        setError(null);
        navigateTo(hasPaidAccess ? 'video' : 'quick-payment');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ImageBackground
                source={GATE_BG_IMAGE}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Dégradé léger en haut pour les icônes de statut */}
                <LinearGradient
                    colors={['rgba(5, 7, 15, 0.7)', 'rgba(5, 7, 15, 0.1)', 'transparent']}
                    style={styles.topVignette}
                />

                {/* DÉGRADÉ OMBRE AU BOTTOM (L'effet demandé) */}
                <LinearGradient
                    colors={[
                        'transparent',
                        'rgba(7, 9, 15, 0.3)',
                        'rgba(7, 9, 15, 0.75)',
                        'rgba(7, 9, 15, 0.95)',
                        '#07090f',
                    ]}
                    locations={[0, 0.35, 0.6, 0.8, 1]}
                    style={styles.bottomShadowGradient}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.contentWrapper}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* En-tête marque épurée en haut */}
                        <View style={styles.headerBrand}>
                            <View style={styles.brandBadge}>
                                <Feather name="shield" size={14} color="#a78bfa" />
                                <Text style={styles.brandBadgeText}>ESPACE PRIVÉ EXCLUSIF</Text>
                            </View>
                        </View>

                        <View style={{ flex: 1 }} />

                        {/* SECTION INFÉRIEURE DANS L'OMBRE DU BOTTOM */}
                        <View style={styles.bottomSection}>
                            <View style={styles.noCodeContainer}>
                                {(hasPaidAccess || hasPendingPayment) && (
                                    <Text style={styles.noCodePrompt}>
                                        {hasPaidAccess
                                            ? 'Votre abonnement est actif.'
                                            : 'Un paiement PayDunya est en attente de vérification.'}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={styles.buyCodeButton}
                                    activeOpacity={0.85}
                                    onPress={handleAccess}
                                    disabled={checkingAccess}
                                >
                                    <View style={styles.buyCodeContent}>
                                        <View style={styles.buyIconWrapper}>
                                            <MaterialCommunityIcons name="credit-card-fast-outline" size={22} color="#a78bfa" />
                                        </View>
                                        <View style={styles.buyTextWrapper}>
                                            <Text style={styles.buyCodeTitle}>
                                                {checkingAccess
                                                    ? 'Vérification de l’accès...'
                                                    : hasPaidAccess
                                                        ? 'Reprendre mes vidéos'
                                                        : hasPendingPayment
                                                            ? 'Vérifier mon paiement'
                                                            : 'Payer et accéder • 50 $ / mois'}
                                            </Text>
                                            <Text style={styles.buyCodeSubtitle}>
                                                Accès 30 jours après confirmation • TMoney, Flooz
                                            </Text>
                                        </View>
                                        {checkingAccess ? (
                                            <ActivityIndicator color="#a78bfa" size="small" />
                                        ) : (
                                            <Feather name="chevron-right" size={20} color="#94a3b8" />
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {error && (
                                    <View style={styles.errorBox}>
                                        <Feather name="alert-circle" size={14} color="#f87171" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                {/* Badges de paiement sécurisé */}
                                <View style={styles.badgesRow}>
                                    <View style={styles.badgeItem}>
                                        <View style={[styles.badgeDot, { backgroundColor: '#eab308' }]} />
                                        <Text style={styles.badgeLabel}>TMoney</Text>
                                    </View>
                                    <View style={styles.badgeItem}>
                                        <View style={[styles.badgeDot, { backgroundColor: '#3b82f6' }]} />
                                        <Text style={styles.badgeLabel}>Flooz</Text>
                                    </View>
                                    <View style={styles.badgeItem}>
                                        <Feather name="zap" size={12} color="#a78bfa" />
                                        <Text style={styles.badgeLabel}>Accès Immédiat</Text>
                                    </View>
                                </View>

                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07090f',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    topVignette: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 140,
    },
    bottomShadowGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: height * 0.72,
    },
    contentWrapper: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingBottom: 36,
        justifyContent: 'space-between',
    },
    headerBrand: {
        alignItems: 'center',
        marginTop: 10,
    },
    brandBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    brandBadgeText: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    bottomSection: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        paddingTop: 10,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 4,
    },
    errorText: {
        color: '#f87171',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    noCodeContainer: {
        alignItems: 'center',
    },
    noCodePrompt: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 12,
    },
    buyCodeButton: {
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.65)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.4)',
        borderRadius: 16,
        padding: 14,
    },
    buyCodeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buyIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    buyTextWrapper: {
        flex: 1,
    },
    buyCodeTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    buyCodeSubtitle: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 2,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        marginTop: 16,
        flexWrap: 'wrap',
    },
    badgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    badgeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    badgeLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '600',
    },
});
