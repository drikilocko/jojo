import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
export const ACCESS_CODE_STORAGE_KEY = '@zone-de-papy/site-unlocked';
export const VALID_CODES_STORAGE_KEY = '@zone-de-papy/valid-codes';
export const DEFAULT_ACCESS_CODE = '8492';

import { GATE_BG_IMAGE } from '../data/media';

export const GateScreen: React.FC = () => {
    const { navigateTo } = useShop();
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const handleUnlock = async () => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
            setError('Veuillez entrer votre code d\'accès');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Récupérer les codes personnalisés enregistrés après un paiement
            const customCodesRaw = await AsyncStorage.getItem(VALID_CODES_STORAGE_KEY);
            const customCodes: string[] = customCodesRaw ? JSON.parse(customCodesRaw) : [];

            // Codes valides par défaut + ceux achetés
            const validCodes = [DEFAULT_ACCESS_CODE, 'PAPY2024', 'VIP2024', ...customCodes];

            if (validCodes.includes(cleanCode)) {
                // Sauvegarder l'état déverrouillé
                await AsyncStorage.setItem(ACCESS_CODE_STORAGE_KEY, 'true');
                // Rediriger vers la page de vidéos privées
                navigateTo('video');
            } else {
                setError('Code d\'accès incorrect. Vérifiez ou achetez votre code ci-dessous.');
            }
        } catch (e) {
            setError('Une erreur est survenue lors de la vérification.');
        } finally {
            setLoading(false);
        }
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
                            {/* Titre & Sous-titre */}
                            <View style={styles.titleContainer}>
                                <Text style={styles.mainTitle}>Accès Sécurisé</Text>
                                <Text style={styles.subtitle}>
                                    Entrez votre code d'accès personnel pour déverrouiller la plateforme.
                                </Text>
                            </View>

                            {/* Boîte de saisie du Code */}
                            <View style={styles.cardInput}>
                                <View style={[styles.inputWrapper, error ? styles.inputErrorBorder : null]}>
                                    <Feather name="lock" size={20} color="#a78bfa" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ex: 8492"
                                        placeholderTextColor="#64748b"
                                        value={code}
                                        onChangeText={(t) => {
                                            setCode(t);
                                            if (error) setError(null);
                                        }}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        returnKeyType="done"
                                        onSubmitEditing={handleUnlock}
                                    />
                                    {code.length > 0 && (
                                        <TouchableOpacity
                                            onPress={() => setCode('')}
                                            style={styles.clearButton}
                                        >
                                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {error && (
                                    <View style={styles.errorBox}>
                                        <Feather name="alert-circle" size={14} color="#f87171" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                {/* Bouton Déverrouiller */}
                                <TouchableOpacity
                                    style={styles.unlockButton}
                                    onPress={handleUnlock}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={['#8b5cf6', '#6366f1']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.unlockGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#ffffff" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.unlockButtonText}>Déverrouiller l'accès</Text>
                                                <Feather name="arrow-right" size={18} color="#ffffff" />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* SÉPARATEUR ÉLÉGANT */}
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OU BIEN</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* BOUTON DU BAS : OBTENIR LE CODE (PAGE DE PAIEMENT) */}
                            <View style={styles.noCodeContainer}>
                                <Text style={styles.noCodePrompt}>
                                    Vous n'avez pas encore de code d'accès ?
                                </Text>

                                <TouchableOpacity
                                    style={styles.buyCodeButton}
                                    activeOpacity={0.85}
                                    onPress={() => navigateTo('quick-payment')}
                                >
                                    <View style={styles.buyCodeContent}>
                                        <View style={styles.buyIconWrapper}>
                                            <MaterialCommunityIcons name="credit-card-fast-outline" size={22} color="#a78bfa" />
                                        </View>
                                        <View style={styles.buyTextWrapper}>
                                            <Text style={styles.buyCodeTitle}>Obtenir mon code • 50 $ / mois</Text>
                                            <Text style={styles.buyCodeSubtitle}>
                                                Accès illimité 30 jours (≈ 30 500 FCFA) • TMoney, Flooz, Carte
                                            </Text>
                                        </View>
                                        <Feather name="chevron-right" size={20} color="#94a3b8" />
                                    </View>
                                </TouchableOpacity>

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
                                        <View style={[styles.badgeDot, { backgroundColor: '#10b981' }]} />
                                        <Text style={styles.badgeLabel}>Carte Visa/MC</Text>
                                    </View>
                                    <View style={styles.badgeItem}>
                                        <Feather name="zap" size={12} color="#a78bfa" />
                                        <Text style={styles.badgeLabel}>Accès Immédiat</Text>
                                    </View>
                                </View>

                                {/* Petit indice discret de test / démo */}
                                <TouchableOpacity
                                    onPress={() => setShowHint(!showHint)}
                                    style={styles.hintToggle}
                                >
                                    <Text style={styles.hintToggleText}>
                                        {showHint ? `Code démo valide : ${DEFAULT_ACCESS_CODE}` : '🔑 Astuce pour tester'}
                                    </Text>
                                </TouchableOpacity>
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
    titleContainer: {
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    cardInput: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.25)',
        paddingHorizontal: 14,
        height: 54,
    },
    inputErrorBorder: {
        borderColor: '#f87171',
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 2,
    },
    clearButton: {
        padding: 4,
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
    unlockButton: {
        marginTop: 14,
        borderRadius: 14,
        overflow: 'hidden',
    },
    unlockGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 15,
        borderRadius: 14,
    },
    unlockButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 22,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    dividerText: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
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
    hintToggle: {
        marginTop: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    hintToggleText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
