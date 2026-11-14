import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Modal,
    Platform,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { initiatePayDunyaPayment, checkPayDunyaPaymentStatus } from '../lib/paydunya';
import {
    clearPendingPayDunyaPayment,
    getPendingPayDunyaPayment,
    redeemAccessCode,
    savePendingPayDunyaPayment,
    saveIssuedAccessCode,
} from '../lib/access';
import { copyAccessCode, downloadAccessCode } from '../lib/accessCodeFiles';
import { PAYMENT_BG_IMAGE } from '../data/media';

interface CountryConfig {
    id: string;
    name: string;
    flag: string;
    dialCode: string;
    phonePlaceholder: string;
    minDigits: number;
    maxDigits: number;
    operators: {
        key: string;
        name: string;
        short: string;
        color: string;
        textColor?: string;
    }[];
}

const COUNTRIES: CountryConfig[] = [
    {
        id: 'TG',
        name: 'Togo',
        flag: '🇹🇬',
        dialCode: '+228',
        phonePlaceholder: '90 12 34 56',
        minDigits: 8,
        maxDigits: 8,
        operators: [
            { key: 'tmoney-tg', name: 'T-Money', short: 'TM', color: '#eab308', textColor: '#000' },
            { key: 'flooz-tg', name: 'Moov Flooz', short: 'FL', color: '#3b82f6', textColor: '#fff' },
        ],
    },
    {
        id: 'SN',
        name: 'Sénégal',
        flag: '🇸🇳',
        dialCode: '+221',
        phonePlaceholder: '77 123 45 67',
        minDigits: 9,
        maxDigits: 9,
        operators: [
            { key: 'orange-sn', name: 'Orange Money', short: 'OM', color: '#f97316', textColor: '#fff' },
            { key: 'wave-sn', name: 'Wave Sénégal', short: 'WV', color: '#06b6d4', textColor: '#fff' },
            { key: 'free-sn', name: 'Free Money', short: 'FR', color: '#ef4444', textColor: '#fff' },
        ],
    },
    {
        id: 'CI',
        name: "Côte d'Ivoire",
        flag: '🇨🇮',
        dialCode: '+225',
        phonePlaceholder: '07 12 34 56 78',
        minDigits: 10,
        maxDigits: 10,
        operators: [
            { key: 'orange-ci', name: 'Orange Money', short: 'OM', color: '#f97316', textColor: '#fff' },
            { key: 'mtn-ci', name: 'MTN MoMo', short: 'MTN', color: '#eab308', textColor: '#000' },
            { key: 'moov-ci', name: 'Moov Money', short: 'MV', color: '#3b82f6', textColor: '#fff' },
        ],
    },
    {
        id: 'BF',
        name: 'Burkina Faso',
        flag: '🇧🇫',
        dialCode: '+226',
        phonePlaceholder: '70 12 34 56',
        minDigits: 8,
        maxDigits: 8,
        operators: [
            { key: 'orange-bf', name: 'Orange Money', short: 'OM', color: '#f97316', textColor: '#fff' },
            { key: 'moov-bf', name: 'Moov Money', short: 'MV', color: '#3b82f6', textColor: '#fff' },
        ],
    },
    {
        id: 'ML',
        name: 'Mali',
        flag: '🇲🇱',
        dialCode: '+223',
        phonePlaceholder: '70 12 34 56',
        minDigits: 8,
        maxDigits: 8,
        operators: [
            { key: 'orange-ml', name: 'Orange Money', short: 'OM', color: '#f97316', textColor: '#fff' },
            { key: 'moov-ml', name: 'Moov Money', short: 'MV', color: '#3b82f6', textColor: '#fff' },
        ],
    },
    {
        id: 'BJ',
        name: 'Bénin',
        flag: '🇧🇯',
        dialCode: '+229',
        phonePlaceholder: '97 12 34 56',
        minDigits: 8,
        maxDigits: 10,
        operators: [
            { key: 'mtn-bj', name: 'MTN MoMo', short: 'MTN', color: '#eab308', textColor: '#000' },
            { key: 'moov-bj', name: 'Moov Money', short: 'MV', color: '#3b82f6', textColor: '#fff' },
        ],
    },
];

export const QuickPaymentScreen: React.FC = () => {
    const { navigateTo } = useShop();

    // Formule mensuelle fixe : 50 $ par mois (= 30 500 FCFA)
    const PRICE_USD = '50 $';
    const priceFCFA = 30500;

    // Pays et Opérateur
    const [selectedCountryId, setSelectedCountryId] = useState<string>('TG');
    const [selectedOperatorKey, setSelectedOperatorKey] = useState<string>('tmoney-tg');

    // Champs de formulaire
    const [phone, setPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // États de vérification PayDunya
    const [waitingForPayment, setWaitingForPayment] = useState(false);
    const [currentInvoiceToken, setCurrentInvoiceToken] = useState<string | null>(null);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [issuedAccessCode, setIssuedAccessCode] = useState<string | null>(null);
    const [issuedAccessExpiry, setIssuedAccessExpiry] = useState<number | null>(null);
    const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
    const verificationInProgress = useRef(false);

    const currentCountry = COUNTRIES.find((c) => c.id === selectedCountryId) || COUNTRIES[0];

    useEffect(() => {
        let mounted = true;
        getPendingPayDunyaPayment()
            .then((pendingPayment) => {
                if (!mounted || !pendingPayment) return;
                setCurrentInvoiceToken(pendingPayment.token);
                setCurrentOrderId(pendingPayment.orderId);
                setWaitingForPayment(true);
            })
            .catch((storageError: unknown) => {
                console.error('Unable to resume pending PayDunya payment.', storageError);
                if (mounted) setErrorMessage('Impossible de reprendre la vérification du paiement.');
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Quand on change de pays, sélectionner le premier opérateur du pays
    const handleSelectCountry = (country: CountryConfig) => {
        setSelectedCountryId(country.id);
        if (country.operators.length > 0) {
            setSelectedOperatorKey(country.operators[0].key);
        }
        setPhone('');
        setErrorMessage(null);
    };

    const grantAccess = async (code: string, expiresAt: string) => {
        const expectedExpiry = Date.parse(expiresAt);
        if (!Number.isSafeInteger(expectedExpiry) || expectedExpiry <= Date.now()) {
            throw new Error('Le code reçu est expiré ou sa date de validité est invalide.');
        }

        const redeemedExpiry = await redeemAccessCode(code);
        if (redeemedExpiry === null) {
            throw new Error('Le paiement est confirmé, mais le code n’a pas pu être activé sur cet appareil.');
        }

        await saveIssuedAccessCode(code, redeemedExpiry);
        await clearPendingPayDunyaPayment();
        setWaitingForPayment(false);
        setCurrentInvoiceToken(null);
        setCurrentOrderId(null);
        setIssuedAccessCode(code);
        setIssuedAccessExpiry(redeemedExpiry);
        setCodeFeedback(null);
    };

    const checkPaymentConfirmation = async (tokenToCheck?: string, orderIdToCheck?: string) => {
        const token = tokenToCheck || currentInvoiceToken;
        const orderId = orderIdToCheck || currentOrderId;
        if (!token || !orderId || verificationInProgress.current) return;

        verificationInProgress.current = true;
        setVerifying(true);
        try {
            const res = await checkPayDunyaPaymentStatus(token, orderId, 'subscription');
            if (!res.success) {
                setErrorMessage(res.error || 'Impossible de vérifier le paiement auprès de PayDunya.');
                return;
            }

            setErrorMessage(null);
            if (res.status === 'completed') {
                if (!res.accessCode || !res.expiresAt) {
                    setErrorMessage('Le paiement est confirmé, mais le code d’accès n’a pas été retourné.');
                    return;
                }
                await grantAccess(res.accessCode, res.expiresAt);
            } else if (res.status === 'cancelled' || res.status === 'failed') {
                await clearPendingPayDunyaPayment();
                setWaitingForPayment(false);
                setCurrentInvoiceToken(null);
                setCurrentOrderId(null);
                setErrorMessage('Le paiement a été annulé sur votre téléphone ou le délai a expiré.');
            }
        } catch (verificationError: unknown) {
            setErrorMessage(verificationError instanceof Error
                ? verificationError.message
                : 'Impossible de vérifier le paiement auprès de PayDunya.');
        } finally {
            verificationInProgress.current = false;
            setVerifying(false);
        }
    };

    // Polling automatique toutes les 4 secondes pendant que l'utilisateur valide son code PIN
    useEffect(() => {
        if (!waitingForPayment || !currentInvoiceToken) return;

        const interval = setInterval(() => {
            checkPaymentConfirmation(currentInvoiceToken, currentOrderId ?? undefined);
        }, 4000);

        return () => clearInterval(interval);
    }, [waitingForPayment, currentInvoiceToken, currentOrderId]);

    const handlePayment = async () => {
        setErrorMessage(null);
        if (currentInvoiceToken && currentOrderId) {
            setWaitingForPayment(true);
            return;
        }

        const cleanDigits = phone.replace(/\D/g, '');
        if (cleanDigits.length < currentCountry.minDigits || cleanDigits.length > currentCountry.maxDigits) {
            setErrorMessage(
                `Veuillez entrer un numéro de téléphone valide pour le ${currentCountry.name} (${currentCountry.minDigits} chiffres requis, ex: ${currentCountry.phonePlaceholder}).`
            );
            return;
        }

        setLoading(true);

        try {
            const orderId = `PASS-${Date.now()}`;
            const dialDigits = currentCountry.dialCode.replace(/\D/g, '');
            const fullPhone = cleanDigits.startsWith(dialDigits)
                ? cleanDigits
                : `${dialDigits}${cleanDigits}`;

            const result = await initiatePayDunyaPayment(orderId, selectedOperatorKey, fullPhone, {
                purchaseType: 'subscription',
            });

            if (!result.success) {
                setErrorMessage(result.error || 'Erreur lors de l\'envoi de la demande de paiement PayDunya.');
                return;
            }

            if (!result.invoiceToken) {
                setErrorMessage('PayDunya n’a pas retourné de référence de paiement valide.');
                return;
            }

            await savePendingPayDunyaPayment(result.invoiceToken, orderId);
            setCurrentInvoiceToken(result.invoiceToken);
            setCurrentOrderId(orderId);
            setWaitingForPayment(true);
        } catch (paymentError: unknown) {
            setErrorMessage(paymentError instanceof Error
                ? paymentError.message
                : 'Une erreur est survenue lors de l\'initiation du paiement.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyIssuedCode = async () => {
        if (!issuedAccessCode) return;
        try {
            await copyAccessCode(issuedAccessCode);
            setCodeFeedback('Code copié.');
        } catch (copyError: unknown) {
            console.error('Unable to copy the issued VIP access code.', copyError);
            setCodeFeedback('Impossible de copier le code.');
        }
    };

    const handleDownloadIssuedCode = async () => {
        if (!issuedAccessCode) return;
        try {
            await downloadAccessCode(issuedAccessCode);
            setCodeFeedback('Fichier du code préparé.');
        } catch (downloadError: unknown) {
            console.error('Unable to save the issued VIP access code.', downloadError);
            setCodeFeedback('Impossible de télécharger le code.');
        }
    };

    const selectedOperator = currentCountry.operators.find((op) => op.key === selectedOperatorKey);

    return (
        <ImageBackground
            source={PAYMENT_BG_IMAGE}
            style={styles.container}
            resizeMode="cover"
        >
            <LinearGradient
                colors={['rgba(7, 9, 15, 0.85)', 'rgba(7, 9, 15, 0.94)', '#07090f']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header / Bouton Retour */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigateTo('gate')}
                    activeOpacity={0.7}
                >
                    <Feather name="arrow-left" size={20} color="#ffffff" />
                    <Text style={styles.backButtonText}>Retour à l'accueil</Text>
                </TouchableOpacity>
                <View style={styles.secureBadge}>
                    <Feather name="lock" size={12} color="#10b981" />
                    <Text style={styles.secureBadgeText}>Paiement 100% Sécurisé</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Résumé de l'offre mensuelle fixe 50$ / mois */}
                <LinearGradient
                    colors={['rgba(139, 92, 246, 0.22)', 'rgba(30, 41, 59, 0.75)']}
                    style={styles.summaryCard}
                >
                    <View style={styles.badgeMonthlyFormula}>
                        <Feather name="star" size={12} color="#fbbf24" />
                        <Text style={styles.badgeMonthlyFormulaText}>ABONNEMENT MENSUEL ILLIMITÉ</Text>
                    </View>

                    <View style={styles.summaryTopRow}>
                        <View style={styles.summaryIcon}>
                            <Feather name="video" size={22} color="#a78bfa" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryTitle}>Accès Intégral aux Vidéos</Text>
                            <Text style={styles.summaryDesc}>Valable 30 jours • Sans engagement</Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceValue}>{PRICE_USD}</Text>
                            <Text style={styles.priceCurrency}>/ mois</Text>
                        </View>
                    </View>

                    <View style={styles.priceEquivBox}>
                        <Feather name="info" size={13} color="#94a3b8" />
                        <Text style={styles.priceEquivText}>
                            Soit {priceFCFA.toLocaleString('fr-FR')} FCFA par mois
                        </Text>
                    </View>
                </LinearGradient>

                <View>
                    <Text style={styles.sectionTitle}>1. Choisissez votre pays</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.countriesScroll}
                    >
                        {COUNTRIES.map((c) => {
                            const isSelected = c.id === selectedCountryId;
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[styles.countryChip, isSelected && styles.countryChipActive]}
                                    onPress={() => handleSelectCountry(c)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.countryFlag}>{c.flag}</Text>
                                    <Text style={[styles.countryName, isSelected && styles.countryNameActive]}>
                                        {c.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
                        2. Choisissez votre opérateur Mobile Money ({currentCountry.name})
                    </Text>
                    <View style={styles.operatorsGrid}>
                        {currentCountry.operators.map((op) => {
                            const isSelected = op.key === selectedOperatorKey;
                            return (
                                <TouchableOpacity
                                    key={op.key}
                                    style={[styles.operatorCard, isSelected && styles.operatorCardActive]}
                                    onPress={() => setSelectedOperatorKey(op.key)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.operatorBadge, { backgroundColor: op.color }]}>
                                        <Text style={[styles.operatorBadgeText, { color: op.textColor || '#fff' }]}>
                                            {op.short}
                                        </Text>
                                    </View>
                                    <Text style={[styles.operatorName, isSelected && styles.operatorNameActive]}>
                                        {op.name}
                                    </Text>
                                    {isSelected && (
                                        <View style={styles.operatorCheckCircle}>
                                            <Feather name="check" size={11} color="#ffffff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.fieldLabel}>
                            Votre numéro de téléphone {selectedOperator?.name || 'Mobile'}
                        </Text>
                        <View style={styles.inputBox}>
                            <Text style={styles.prefixText}>{currentCountry.dialCode}</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder={currentCountry.phonePlaceholder}
                                placeholderTextColor="#64748b"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                                maxLength={14}
                            />
                        </View>
                        <Text style={styles.helpText}>
                            Une demande PayDunya sera envoyée sur votre mobile. L’accès sera ouvert uniquement après confirmation du paiement.
                        </Text>
                    </View>
                </View>

                {errorMessage && (
                    <View style={styles.errorBox}>
                        <Feather name="alert-circle" size={16} color="#f87171" />
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                )}

                {/* Bouton de confirmation de paiement */}
                <TouchableOpacity
                    style={styles.payButton}
                    activeOpacity={0.85}
                    onPress={handlePayment}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#8b5cf6', '#6366f1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.payGradient}
                    >
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text style={styles.payButtonText}>Validation en cours...</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.payButtonText}>
                                    Payer 50 $ (≈ {priceFCFA.toLocaleString('fr-FR')} FCFA)
                                </Text>
                                <Feather name="check-circle" size={20} color="#ffffff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={waitingForPayment}
                transparent
                animationType="fade"
                onRequestClose={() => setWaitingForPayment(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIconRing, { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.35)' }]}>
                            <Feather name="smartphone" size={32} color="#eab308" />
                        </View>

                        <Text style={styles.modalTitle}>Validation sur votre Mobile</Text>
                        <Text style={styles.modalSub}>
                            Une demande de <Text style={{ fontWeight: '800', color: '#ffffff' }}>{priceFCFA.toLocaleString('fr-FR')} FCFA</Text> est en attente. Validez-la sur le téléphone utilisé pour le paiement.
                        </Text>
                        <Text style={[styles.modalSub, { marginTop: 6, color: '#a78bfa' }]}>
                            Confirmez avec votre code PIN secret sur votre téléphone pour finaliser l'opération.
                        </Text>

                        <View style={styles.waitingStatusBox}>
                            <ActivityIndicator size="small" color="#eab308" />
                            <Text style={styles.waitingStatusText}>
                                {verifying ? 'Vérification du paiement...' : 'En attente de votre code PIN...'}
                            </Text>
                        </View>

                        {errorMessage && (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.directAccessButton}
                            onPress={() => checkPaymentConfirmation(currentInvoiceToken ?? undefined, currentOrderId ?? undefined)}
                            activeOpacity={0.85}
                            disabled={verifying}
                        >
                            <LinearGradient
                                colors={['#8b5cf6', '#6366f1']}
                                style={styles.directAccessGradient}
                            >
                                <Feather name="refresh-cw" size={16} color="#ffffff" />
                                <Text style={styles.directAccessText}>J'ai validé mon code PIN, vérifier</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ marginTop: 14, padding: 8 }}
                            onPress={() => setWaitingForPayment(false)}
                        >
                            <Text style={{ color: '#94a3b8', fontSize: 13, textDecorationLine: 'underline' }}>
                                Annuler ou changer de numéro
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={issuedAccessCode !== null}
                transparent
                animationType="fade"
                onRequestClose={() => navigateTo('video')}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.issuedCodeIcon}>
                            <Feather name="check" size={30} color="#34d399" />
                        </View>
                        <Text style={styles.modalTitle}>Paiement confirmé !</Text>
                        <Text style={styles.modalSub}>
                            Votre code d’accès personnel est activé sur cet appareil.
                        </Text>
                        <Text selectable style={styles.issuedCodeValue}>{issuedAccessCode}</Text>
                        {issuedAccessExpiry !== null && (
                            <Text style={styles.issuedCodeExpiry}>
                                Valable jusqu’au {new Date(issuedAccessExpiry).toLocaleDateString('fr-FR')}
                            </Text>
                        )}
                        <View style={styles.issuedCodeActions}>
                            <TouchableOpacity style={styles.issuedCodeAction} onPress={handleCopyIssuedCode}>
                                <Feather name="copy" size={16} color="#ffffff" />
                                <Text style={styles.issuedCodeActionText}>Copier</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.issuedCodeAction} onPress={handleDownloadIssuedCode}>
                                <Feather name="download" size={16} color="#ffffff" />
                                <Text style={styles.issuedCodeActionText}>Télécharger</Text>
                            </TouchableOpacity>
                        </View>
                        {codeFeedback && <Text style={styles.codeFeedback}>{codeFeedback}</Text>}
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => navigateTo('video')}
                        >
                            <Text style={styles.continueButtonText}>Accéder aux vidéos</Text>
                            <Feather name="arrow-right" size={18} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#07090f',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingHorizontal: 14,
        paddingTop: Platform.OS === 'ios' ? 54 : 36,
        paddingBottom: 16,
        backgroundColor: 'rgba(10, 13, 22, 0.7)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    secureBadgeText: {
        color: '#10b981',
        fontSize: 11,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
        maxWidth: 540,
        width: '100%',
        alignSelf: 'center',
    },
    summaryCard: {
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        marginBottom: 20,
    },
    badgeMonthlyFormula: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    badgeMonthlyFormulaText: {
        color: '#fbbf24',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    summaryDesc: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
    },
    priceCurrency: {
        fontSize: 11,
        color: '#a78bfa',
    },
    priceEquivBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    priceEquivText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 10,
    },
    countriesScroll: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    countryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    countryChipActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.25)',
        borderColor: '#a78bfa',
    },
    countryFlag: {
        fontSize: 16,
    },
    countryName: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    countryNameActive: {
        color: '#ffffff',
        fontWeight: '700',
    },
    operatorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    operatorCard: {
        flex: 1,
        minWidth: 140,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    operatorCardActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: '#8b5cf6',
    },
    operatorBadge: {
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    operatorBadgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    operatorName: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    operatorNameActive: {
        color: '#ffffff',
        fontWeight: '700',
    },
    operatorCheckCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formContainer: {
        marginTop: 6,
    },
    fieldLabel: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 14,
        height: 48,
    },
    prefixText: {
        color: '#a78bfa',
        fontWeight: '700',
        fontSize: 14,
        marginRight: 8,
    },
    fieldInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
        height: '100%',
    },
    helpText: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 6,
        lineHeight: 16,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 10,
        padding: 12,
        marginTop: 16,
    },
    errorText: {
        color: '#f87171',
        fontSize: 12,
        flex: 1,
    },
    payButton: {
        marginTop: 22,
        borderRadius: 14,
        overflow: 'hidden',
    },
    payGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    payButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#0f172a',
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    modalIconRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    issuedCodeIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    issuedCodeValue: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 1,
        marginTop: 16,
    },
    issuedCodeExpiry: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 6,
    },
    issuedCodeActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    issuedCodeAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#4f46e5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    issuedCodeActionText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    codeFeedback: {
        color: '#a7f3d0',
        fontSize: 12,
        marginTop: 12,
    },
    continueButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 13,
        marginTop: 20,
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 18,
    },
    waitingStatusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.25)',
    },
    waitingStatusText: {
        color: '#eab308',
        fontSize: 12,
        fontWeight: '600',
    },
    directAccessButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    directAccessGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
    },
    directAccessText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
});
