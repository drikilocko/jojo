import React, { useState, useEffect } from 'react';
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { initiatePayDunyaPayment, checkPayDunyaPaymentStatus } from '../lib/paydunya';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VALID_CODES_STORAGE_KEY } from './GateScreen';
import { ACCESS_EXPIRY_STORAGE_KEY } from './VideoScreen';
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
    const DURATION_DAYS = 30;

    // Type de méthode : 'mobile' ou 'card'
    const [methodType, setMethodType] = useState<'mobile' | 'card'>('mobile');

    // Pays et Opérateur
    const [selectedCountryId, setSelectedCountryId] = useState<string>('TG');
    const [selectedOperatorKey, setSelectedOperatorKey] = useState<string>('tmoney-tg');

    // Champs de formulaire
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // États de vérification PayDunya
    const [waitingForPayment, setWaitingForPayment] = useState(false);
    const [currentInvoiceToken, setCurrentInvoiceToken] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    // Modal de confirmation / réception du code
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);

    const currentCountry = COUNTRIES.find((c) => c.id === selectedCountryId) || COUNTRIES[0];

    // Quand on change de pays, sélectionner le premier opérateur du pays
    const handleSelectCountry = (country: CountryConfig) => {
        setSelectedCountryId(country.id);
        if (country.operators.length > 0) {
            setSelectedOperatorKey(country.operators[0].key);
        }
        setPhone('');
        setErrorMessage(null);
    };

    // Délivrer le code UNIQUEMENT après paiement validé
    const deliverCodeAndFinish = async () => {
        const newCode = `VIP-${Math.floor(1000 + Math.random() * 9000)}`;
        const existingCodesRaw = await AsyncStorage.getItem(VALID_CODES_STORAGE_KEY);
        const existingCodes: string[] = existingCodesRaw ? JSON.parse(existingCodesRaw) : [];
        if (!existingCodes.includes(newCode)) {
            existingCodes.push(newCode);
            await AsyncStorage.setItem(VALID_CODES_STORAGE_KEY, JSON.stringify(existingCodes));
        }

        const expiryTimestamp = Date.now() + DURATION_DAYS * 24 * 60 * 60 * 1000;
        await AsyncStorage.setItem(ACCESS_EXPIRY_STORAGE_KEY, expiryTimestamp.toString());

        setGeneratedCode(newCode);
        setWaitingForPayment(false);
        setShowSuccessModal(true);
    };

    // Vérifier auprès de PayDunya si le code PIN a été validé sur le téléphone
    const checkPaymentConfirmation = async (tokenToCheck?: string) => {
        const token = tokenToCheck || currentInvoiceToken;
        if (!token) return;

        setVerifying(true);
        try {
            const res = await checkPayDunyaPaymentStatus(token);
            if (res.status === 'completed') {
                // Paiement mobile confirmé par PayDunya !
                await deliverCodeAndFinish();
            } else if (res.status === 'cancelled' || res.status === 'failed') {
                setWaitingForPayment(false);
                setErrorMessage('Le paiement a été annulé sur votre téléphone ou le délai a expiré.');
            }
        } catch {
            // En attente
        } finally {
            setVerifying(false);
        }
    };

    // Polling automatique toutes les 4 secondes pendant que l'utilisateur valide son code PIN
    useEffect(() => {
        if (!waitingForPayment || !currentInvoiceToken) return;

        const interval = setInterval(() => {
            checkPaymentConfirmation(currentInvoiceToken);
        }, 4000);

        return () => clearInterval(interval);
    }, [waitingForPayment, currentInvoiceToken]);

    const handlePayment = async () => {
        setErrorMessage(null);

        if (methodType === 'mobile') {
            const cleanDigits = phone.replace(/\D/g, '');
            if (cleanDigits.length < currentCountry.minDigits || cleanDigits.length > currentCountry.maxDigits) {
                setErrorMessage(
                    `Veuillez entrer un numéro de téléphone valide pour le ${currentCountry.name} (${currentCountry.minDigits} chiffres requis, ex: ${currentCountry.phonePlaceholder}).`
                );
                return;
            }
        } else {
            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
                setErrorMessage('Veuillez renseigner un numéro de carte bancaire valide à 16 chiffres.');
                return;
            }
        }

        setLoading(true);

        try {
            const orderId = `PASS-${Date.now()}`;

            if (methodType === 'mobile') {
                // Format international sans le '+'
                const cleanDigits = phone.replace(/\D/g, '');
                const dialDigits = currentCountry.dialCode.replace(/\D/g, '');
                const fullPhone = cleanDigits.startsWith(dialDigits)
                    ? cleanDigits
                    : `${dialDigits}${cleanDigits}`;

                const result = await initiatePayDunyaPayment(orderId, selectedOperatorKey, fullPhone, {
                    amountXOF: priceFCFA,
                    customerName: name.trim() || 'Client VIP',
                });

                if (!result.success) {
                    setErrorMessage(result.error || 'Erreur lors de l\'envoi de la demande de paiement PayDunya.');
                    setLoading(false);
                    return;
                }

                if (result.invoiceToken) {
                    setCurrentInvoiceToken(result.invoiceToken);
                    setWaitingForPayment(true);
                    setLoading(false);
                    return;
                }
            } else {
                // Simulation paiement carte bancaire
                await new Promise((res) => setTimeout(res, 1200));
                await deliverCodeAndFinish();
            }
        } catch (e: any) {
            setErrorMessage(e.message || 'Une erreur est survenue lors de l\'initiation du paiement.');
        } finally {
            setLoading(false);
        }
    };

    // Rediriger vers l'écran d'accueil pour que l'utilisateur saisisse son code manuellement
    const handleReturnToGate = () => {
        setShowSuccessModal(false);
        navigateTo('gate');
    };

    const handleCopyCode = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
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

                {/* Choix du mode principal : Mobile Money ou Carte Bancaire */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, methodType === 'mobile' && styles.tabButtonActive]}
                        onPress={() => setMethodType('mobile')}
                        activeOpacity={0.8}
                    >
                        <Feather name="smartphone" size={16} color={methodType === 'mobile' ? '#ffffff' : '#94a3b8'} />
                        <Text style={[styles.tabButtonText, methodType === 'mobile' && styles.tabButtonTextActive]}>
                            Mobile Money (Afrique)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, methodType === 'card' && styles.tabButtonActive]}
                        onPress={() => setMethodType('card')}
                        activeOpacity={0.8}
                    >
                        <Feather name="credit-card" size={16} color={methodType === 'card' ? '#ffffff' : '#94a3b8'} />
                        <Text style={[styles.tabButtonText, methodType === 'card' && styles.tabButtonTextActive]}>
                            Carte Bancaire (CB)
                        </Text>
                    </TouchableOpacity>
                </View>

                {methodType === 'mobile' ? (
                    <View>
                        {/* 1. Sélecteur de PAYS */}
                        <Text style={styles.sectionTitle}>1. Choisissez votre Pays</Text>
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

                        {/* 2. Sélecteur d'OPÉRATEUR MOBILE MONEY */}
                        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
                            2. Choisissez votre Opérateur Mobile ({currentCountry.name})
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

                        {/* 3. Numéro de téléphone */}
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
                                Vous recevrez une demande de validation USSD directement sur votre mobile pour confirmer {priceFCFA.toLocaleString('fr-FR')} FCFA.
                            </Text>
                        </View>
                    </View>
                ) : (
                    /* Carte bancaire */
                    <View style={styles.formContainer}>
                        <Text style={styles.fieldLabel}>Nom complet sur la carte</Text>
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="Ex: Jean Dupont"
                                placeholderTextColor="#64748b"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Numéro de carte (Visa / Mastercard)</Text>
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="4532 •••• •••• 8910"
                                placeholderTextColor="#64748b"
                                keyboardType="number-pad"
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                maxLength={19}
                            />
                        </View>

                        <View style={styles.cardRow}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Date d'exp.</Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={styles.fieldInput}
                                        placeholder="MM/AA"
                                        placeholderTextColor="#64748b"
                                        value={cardExpiry}
                                        onChangeText={setCardExpiry}
                                        maxLength={5}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CVC / CVV</Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={styles.fieldInput}
                                        placeholder="123"
                                        placeholderTextColor="#64748b"
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        value={cardCvc}
                                        onChangeText={setCardCvc}
                                        maxLength={4}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

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

            {/* MODAL 1 : EN ATTENTE DE VALIDATION DU CODE PIN SUR LE TÉLÉPHONE */}
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
                            Une demande de <Text style={{ fontWeight: '800', color: '#ffffff' }}>{priceFCFA.toLocaleString('fr-FR')} FCFA</Text> ({selectedOperator?.name}) a été transmise à votre numéro.
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

                        <TouchableOpacity
                            style={styles.directAccessButton}
                            onPress={() => checkPaymentConfirmation()}
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

            {/* MODAL 2 : PAIEMENT CONFIRMÉ ET REMISE DU CODE (RETOUR À L'ACCUEIL SANS REDIRECTION AUTO) */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconRing}>
                            <Feather name="check" size={32} color="#10b981" />
                        </View>

                        <Text style={styles.modalTitle}>Paiement Confirmé avec Succès !</Text>
                        <Text style={styles.modalSub}>
                            Votre transaction a été validée. Conservez précieusement votre code d'accès personnel :
                        </Text>

                        {/* Grand affichage du code */}
                        <View style={styles.codeRevealBox}>
                            <Text style={styles.codeRevealText}>{generatedCode}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleCopyCode}
                            activeOpacity={0.8}
                        >
                            <Feather name={copied ? 'check' : 'copy'} size={16} color="#a78bfa" />
                            <Text style={styles.copyButtonText}>
                                {copied ? 'Code copié dans le presse-papier !' : 'Copier mon code'}
                            </Text>
                        </TouchableOpacity>

                        {/* Bouton pour retourner sur l'accueil taper le code (pas de redirection auto) */}
                        <TouchableOpacity
                            style={styles.directAccessButton}
                            onPress={handleReturnToGate}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#8b5cf6', '#6366f1']}
                                style={styles.directAccessGradient}
                            >
                                <Feather name="arrow-left" size={18} color="#ffffff" />
                                <Text style={styles.directAccessText}>Retourner à l'accueil pour entrer mon code</Text>
                            </LinearGradient>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        gap: 6,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: '#8b5cf6',
    },
    tabButtonText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    tabButtonTextActive: {
        color: '#ffffff',
        fontWeight: '700',
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
    cardRow: {
        flexDirection: 'row',
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
    codeRevealBox: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderWidth: 2,
        borderColor: '#8b5cf6',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 28,
        marginVertical: 18,
    },
    codeRevealText: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 4,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderRadius: 10,
        marginBottom: 20,
    },
    copyButtonText: {
        color: '#c4b5fd',
        fontSize: 13,
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
