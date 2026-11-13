import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '../context/LanguageContext';
import { Feather, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { Header } from '../components/Header';
import { LeafletMapPicker } from '../components/LeafletMapPicker';
import { getErrorMessage } from '../lib/supabase';
import { initiatePayDunyaPayment, isValidTogoMobileNumber, usdToXOF } from '../lib/paydunya';
import { Order } from '../types';

const CHECKOUT_STEPS = [
    { number: 1, title: 'Livraison' },
    { number: 2, title: 'Paiement' },
    { number: 3, title: 'Confirmation' },
] as const;

export const CheckoutScreen: React.FC = () => {
    const {
        cart,
        cartTotal,
        cartSubtotal,
        discount,
        shippingCost,
        user,
        authLoading,
        setShowAuthModal,
        placeOrder,
        formatPrice,
        navigateTo,
        currency,
    } = useShop();

    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 1024;

    const [fullName, setFullName] = useState(user?.savedAddress?.fullName || user?.name || '');
    const [address, setAddress] = useState(user?.savedAddress?.address || '');
    const [city, setCity] = useState(user?.savedAddress?.city || '');
    const [postalCode, setPostalCode] = useState(user?.savedAddress?.postalCode || '');
    const [phone, setPhone] = useState(user?.savedAddress?.phone || '');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay' | 'paypal' | 'cod' | 'tmoney' | 'flooz'>('tmoney');

    // Numéro Mobile Money séparé (peut différer du tel de livraison)
    const [momoPhone, setMomoPhone] = useState('');

    useEffect(() => {
        if (!user) return;
        setFullName(user.savedAddress?.fullName || user.name);
        setAddress(user.savedAddress?.address || '');
        setCity(user.savedAddress?.city || '');
        setPostalCode(user.savedAddress?.postalCode || '');
        setPhone(user.savedAddress?.phone || '');
    }, [user]);

    // Credit Card details
    const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvc, setCardCvc] = useState('888');

    const [loading, setLoading] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

    const [paydunyaLoading, setPaydunyaLoading] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

    const isMobileMoney = paymentMethod === 'tmoney' || paymentMethod === 'flooz';
    const summaryItems = submittedOrder?.items ?? cart;
    const summarySubtotal = submittedOrder?.subtotal ?? cartSubtotal;
    const summaryDiscount = submittedOrder?.discount ?? discount;
    const summaryShipping = submittedOrder?.shipping ?? shippingCost;
    const summaryTotal = submittedOrder?.total ?? cartTotal;

    useEffect(() => {
        if (!authLoading && !user) setShowAuthModal(true);
    }, [authLoading, user, setShowAuthModal]);

    const handleContinue = () => {
        setOrderError(null);
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        if (currentStep === 1) {
            if (!fullName.trim() || !address.trim() || !city.trim() || !phone.trim()) {
                setOrderError('Remplis ton nom, ton adresse, ta ville et ton téléphone pour continuer.');
                return;
            }
            setCurrentStep(2);
            return;
        }

        if (isMobileMoney && !isValidTogoMobileNumber(momoPhone || phone)) {
            setOrderError('Saisis un numéro Togo valide de 8 chiffres pour recevoir la demande de paiement.');
            return;
        }
        setCurrentStep(3);
    };

    const handleMobileMoneyPayment = async (orderId: string, method: 'tmoney' | 'flooz') => {
        setPaydunyaLoading(true);
        try {
            const operatorKey = method === 'tmoney' ? 'tmoney-tg' : 'flooz-tg';
            const result = await initiatePayDunyaPayment(
                orderId,
                operatorKey,
                momoPhone || phone
            );

            if (result.success) {
                setPaymentMessage(
                    `${result.message} Montant demandé : ${result.amountXOF?.toLocaleString()} FCFA.`
                );
            } else {
                setOrderError(result.error || 'Erreur PayDunya. Veuillez réessayer.');
            }
        } catch (error) {
            setOrderError(getErrorMessage(error));
        } finally {
            setPaydunyaLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        setOrderError(null);
        setPaymentMessage(null);
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        if (isMobileMoney && !isValidTogoMobileNumber(momoPhone || phone)) {
            setOrderError('Saisis un numéro Togo valide de 8 chiffres pour recevoir la demande de paiement.');
            return;
        }
        setLoading(true);
        try {
            const order = submittedOrder ?? await placeOrder(
                    { fullName, address, city, postalCode, phone },
                    paymentMethod
                );
            if (!order) return;

            // Si paiement mobile money → lancer PayDunya après création commande
            if ((paymentMethod === 'tmoney' || paymentMethod === 'flooz') && order) {
                setSubmittedOrder(order);
                await handleMobileMoneyPayment(order.id, paymentMethod);
            }
        } catch (error) {
            setOrderError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.topHeader}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigateTo('cart')}>
                        <Feather name="arrow-left" size={16} color="#475569" />
                        <Text style={styles.backBtnText}>Retour au panier</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>Paiement express</Text>
                </View>

                <View style={styles.stepsRow}>
                    {CHECKOUT_STEPS.map((step, index) => (
                        <React.Fragment key={step.number}>
                            {index > 0 && (
                                <View
                                    style={[
                                        styles.stepConnector,
                                        currentStep >= step.number && styles.stepConnectorActive,
                                    ]}
                                />
                            )}
                            <TouchableOpacity
                                style={styles.stepItem}
                                onPress={() => {
                                    if (!submittedOrder && step.number < currentStep) {
                                        setCurrentStep(step.number);
                                        setOrderError(null);
                                    }
                                }}
                                disabled={submittedOrder !== null || step.number >= currentStep}
                                accessibilityRole="button"
                                accessibilityState={{
                                    disabled: submittedOrder !== null || step.number >= currentStep,
                                }}
                            >
                                <View
                                    style={[
                                        styles.stepIndicator,
                                        currentStep >= step.number && styles.stepIndicatorActive,
                                    ]}
                                >
                                    {currentStep > step.number ? (
                                        <Feather name="check" size={14} color="#ffffff" />
                                    ) : (
                                        <Text
                                            style={[
                                                styles.stepIndicatorText,
                                                currentStep >= step.number && styles.stepIndicatorTextActive,
                                            ]}
                                        >
                                            {step.number}
                                        </Text>
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        currentStep === step.number && styles.stepLabelActive,
                                    ]}
                                >
                                    {step.title}
                                </Text>
                            </TouchableOpacity>
                        </React.Fragment>
                    ))}
                </View>

                <View
                    style={[
                        styles.layoutWrapper,
                        isLargeScreen ? styles.layoutWrapperRow : styles.layoutWrapperMobile,
                    ]}
                >
                    {/* Left Checkout Details Form */}
                    <View style={[styles.formContainer, !isLargeScreen && styles.formContainerMobile]}>
                        {/* Step 1: Shipping Address */}
                        {currentStep === 1 && (
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>1</Text>
                                </View>
                                <Text style={styles.sectionTitle}>Adresse de livraison</Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Nom complet</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Ex: Kofi Mensah"
                                />
                            </View>

                            <LeafletMapPicker
                                currentAddress={address}
                                onSelectAddress={(data) => {
                                    setAddress(data.address);
                                    if (data.city) setCity(data.city);
                                    if (data.postalCode) setPostalCode(data.postalCode);
                                }}
                            />

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Adresse</Text>
                                <TextInput
                                    style={styles.input}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Rue, quartier..."
                                />
                            </View>

                            <View style={styles.rowForm}>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Ville</Text>
                                    <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Lomé" />
                                </View>

                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Code postal</Text>
                                    <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="00228" />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Téléphone de livraison</Text>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+228 90 00 00 00"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                        )}

                        {/* Step 2: Payment Method */}
                        {currentStep === 2 && (
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>2</Text>
                                </View>
                                <Text style={styles.sectionTitle}>Mode de paiement</Text>
                            </View>

                            {/* Mobile Money Banner */}
                            <View style={styles.momoRecommendBanner}>
                                <MaterialCommunityIcons name="cellphone-check" size={18} color="#7c3aed" />
                                <Text style={styles.momoRecommendText}>
                                    Paiement mobile money recommandé au Togo 🇹🇬
                                </Text>
                            </View>

                            <View style={styles.paymentMethodsGrid}>
                                {/* TMoney */}
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'tmoney' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('tmoney')}
                                >
                                    <View style={[styles.momoIcon, styles.tmoneyIcon]}>
                                        <Text style={styles.momoIconText}>T</Text>
                                    </View>
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'tmoney' && styles.paymentOptionTextActive]}>
                                        TMoney
                                    </Text>
                                    {paymentMethod === 'tmoney' && (
                                        <Feather name="check-circle" size={16} color="#7c3aed" style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>

                                {/* Flooz */}
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'flooz' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('flooz')}
                                >
                                    <View style={[styles.momoIcon, styles.floozIcon]}>
                                        <Text style={styles.momoIconText}>F</Text>
                                    </View>
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'flooz' && styles.paymentOptionTextActive]}>
                                        Flooz (Moov)
                                    </Text>
                                    {paymentMethod === 'flooz' && (
                                        <Feather name="check-circle" size={16} color="#7c3aed" style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>

                                {/* Credit Card */}
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('card')}
                                >
                                    <Feather name="credit-card" size={20} color={paymentMethod === 'card' ? '#8b72e6' : '#475569'} />
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'card' && styles.paymentOptionTextActive]}>
                                        Carte bancaire
                                    </Text>
                                </TouchableOpacity>

                                {/* COD */}
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('cod')}
                                >
                                    <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cod' ? '#8b72e6' : '#475569'} />
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'cod' && styles.paymentOptionTextActive]}>
                                        Cash à la livraison
                                    </Text>
                                </TouchableOpacity>

                                {/* Apple Pay */}
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'apple-pay' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('apple-pay')}
                                >
                                    <FontAwesome name="apple" size={20} color={paymentMethod === 'apple-pay' ? '#8b72e6' : '#475569'} />
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'apple-pay' && styles.paymentOptionTextActive]}>
                                        Apple Pay
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Mobile Money Phone Input */}
                            {isMobileMoney && (
                                <View style={styles.momoInputWrapper}>
                                    <View style={styles.momoInputHeader}>
                                        <View style={[styles.momoIcon, paymentMethod === 'tmoney' ? styles.tmoneyIcon : styles.floozIcon]}>
                                            <Text style={styles.momoIconText}>{paymentMethod === 'tmoney' ? 'T' : 'F'}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.momoInputTitle}>
                                                Numéro {paymentMethod === 'tmoney' ? 'TMoney' : 'Flooz'}
                                            </Text>
                                            <Text style={styles.momoInputSubtitle}>
                                                Tu recevras une demande de confirmation sur ce numéro
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.inputLabel}>Numéro Mobile Money</Text>
                                        <TextInput
                                            style={[styles.input, styles.momoPhoneInput]}
                                            value={momoPhone}
                                            onChangeText={setMomoPhone}
                                            placeholder={paymentMethod === 'tmoney' ? '+228 90 XX XX XX' : '+228 99 XX XX XX'}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                    <View style={styles.paydunyaBadge}>
                                        <Text style={styles.paydunyaBadgeText}>
                                            🔒 Paiement sécurisé via PayDunya
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Card Inputs if Card Selected */}
                            {paymentMethod === 'card' && (
                                <View style={styles.cardInputWrapper}>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.inputLabel}>Numéro de carte</Text>
                                        <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} />
                                    </View>
                                    <View style={styles.rowForm}>
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>Date d'expiration</Text>
                                            <TextInput style={styles.input} value={cardExpiry} onChangeText={setCardExpiry} />
                                        </View>
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>CVV / CVC</Text>
                                            <TextInput style={styles.input} value={cardCvc} onChangeText={setCardCvc} />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                        )}

                        {orderError && currentStep !== 3 ? (
                            <Text style={styles.orderError}>{orderError}</Text>
                        ) : null}

                        {currentStep < 3 ? (
                            <TouchableOpacity style={styles.stepContinueBtn} onPress={handleContinue}>
                                <Text style={styles.stepContinueBtnText}>
                                    {currentStep === 1 ? 'CONTINUER VERS LE PAIEMENT' : 'CONTINUER VERS LA CONFIRMATION'}
                                </Text>
                                <Feather name="arrow-right" size={18} color="#ffffff" />
                            </TouchableOpacity>
                        ) : !submittedOrder ? (
                            <TouchableOpacity style={styles.stepBackBtn} onPress={() => setCurrentStep(2)}>
                                <Feather name="arrow-left" size={16} color="#111111" />
                                <Text style={styles.stepBackBtnText}>Modifier le paiement</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Right Order Review & Place Action */}
                    {currentStep === 3 && <View style={[styles.reviewContainer, !isLargeScreen && styles.reviewContainerMobile]}>
                        <View style={[styles.reviewCard, !isLargeScreen && styles.reviewCardMobile]}>
                            <Text style={styles.reviewTitle}>Récapitulatif</Text>
                            <View style={styles.confirmationDetails}>
                                <Text style={styles.confirmationLabel}>Livraison</Text>
                                <Text style={styles.confirmationValue}>
                                    {fullName} · {address}, {city}
                                </Text>
                                <Text style={styles.confirmationLabel}>Paiement</Text>
                                <Text style={styles.confirmationValue}>
                                    {paymentMethod === 'tmoney'
                                        ? 'TMoney'
                                        : paymentMethod === 'flooz'
                                            ? 'Flooz (Moov)'
                                            : paymentMethod === 'card'
                                                ? 'Carte bancaire'
                                                : paymentMethod === 'apple-pay'
                                                    ? 'Apple Pay'
                                                    : 'Cash à la livraison'}
                                </Text>
                            </View>

                            {summaryItems.map((item, idx) => (
                                <View key={idx} style={styles.miniItemRow}>
                                    <Text style={styles.miniItemQty}>{item.quantity}x</Text>
                                    <Text style={styles.miniItemName} numberOfLines={1}>{item.product.name}</Text>
                                    <Text style={styles.miniItemPrice}>{formatPrice(item.product.price * item.quantity)}</Text>
                                </View>
                            ))}

                            <View style={styles.divider} />

                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Sous-total</Text>
                                <Text style={styles.calcValue}>{formatPrice(summarySubtotal)}</Text>
                            </View>

                            {summaryDiscount > 0 && (
                                <View style={styles.calcRow}>
                                    <Text style={[styles.calcLabel, styles.discountText]}>Réduction promo</Text>
                                    <Text style={[styles.calcValue, styles.discountText]}>-{formatPrice(summaryDiscount)}</Text>
                                </View>
                            )}

                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Livraison</Text>
                                <Text style={styles.calcValue}>
                                    {summaryShipping === 0 ? 'GRATUIT Express' : formatPrice(summaryShipping)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>{formatPrice(summaryTotal)}</Text>
                            </View>

                            {isMobileMoney && currency.code !== 'FCFA' && (
                                <View style={styles.xofRow}>
                                    <Text style={styles.xofLabel}>Équivalent XOF</Text>
                                    <Text style={styles.xofValue}>{usdToXOF(summaryTotal).toLocaleString()} FCFA</Text>
                                </View>
                            )}

                            {orderError ? <Text style={styles.orderError}>{orderError}</Text> : null}
                            {paymentMessage ? <Text style={styles.paymentMessage}>{paymentMessage}</Text> : null}

                            <TouchableOpacity
                                style={[
                                    styles.placeOrderBtn,
                                    isMobileMoney && styles.placeOrderBtnMomo,
                                    loading && styles.placeOrderBtnLoading,
                                ]}
                                onPress={handlePlaceOrder}
                                disabled={loading || paydunyaLoading}
                            >
                                {(loading || paydunyaLoading) ? (
                                    <>
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text style={styles.placeOrderBtnText}>
                                            {paydunyaLoading ? 'CONNEXION PAYDUNYA...' : 'TRAITEMENT...'}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        {isMobileMoney && (
                                            <MaterialCommunityIcons name="cellphone-check" size={18} color="#ffffff" />
                                        )}
                                        <Text style={styles.placeOrderBtnText}>
                                            {isMobileMoney
                                                ? `PAYER VIA ${paymentMethod === 'tmoney' ? 'TMONEY' : 'FLOOZ'}`
                                                : 'CONFIRMER LA COMMANDE'}
                                        </Text>
                                        {!isMobileMoney && <Feather name="check" size={18} color="#ffffff" />}
                                    </>
                                )}
                            </TouchableOpacity>

                            {isMobileMoney && (
                                <Text style={styles.paydunyaNote}>
                                    Tu recevras une demande de paiement {paymentMethod === 'tmoney' ? 'T-Money' : 'Moov Flooz'} sur ton téléphone. Valide-la pour terminer la commande.
                                </Text>
                            )}
                        </View>
                    </View>}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        paddingHorizontal: 12,
    },
    stepItem: {
        alignItems: 'center',
        gap: 6,
        minWidth: 76,
    },
    stepIndicator: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#a3a3a3',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicatorActive: {
        backgroundColor: '#111111',
        borderColor: '#111111',
    },
    stepIndicatorText: {
        color: '#525252',
        fontSize: 13,
        fontWeight: '800',
    },
    stepIndicatorTextActive: {
        color: '#ffffff',
    },
    stepLabel: {
        color: '#737373',
        fontSize: 11,
        fontWeight: '700',
    },
    stepLabelActive: {
        color: '#111111',
    },
    stepConnector: {
        height: 1,
        flex: 1,
        maxWidth: 100,
        backgroundColor: '#d4d4d4',
        marginBottom: 18,
    },
    stepConnectorActive: {
        backgroundColor: '#111111',
    },
    layoutWrapper: {
        gap: 24,
    },
    layoutWrapperRow: {
        flexDirection: 'row',
    },
    layoutWrapperMobile: {
        gap: 12,
    },
    formContainer: {
        flex: 2,
        gap: 20,
    },
    formContainerMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
    },
    stepContinueBtn: {
        backgroundColor: '#111111',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    stepContinueBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    stepBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        paddingVertical: 10,
    },
    stepBackBtnText: {
        color: '#111111',
        fontSize: 13,
        fontWeight: '800',
    },
    confirmationDetails: {
        backgroundColor: '#f5f5f5',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        gap: 4,
    },
    confirmationLabel: {
        color: '#737373',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    confirmationValue: {
        color: '#111111',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    sectionCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#8b72e6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBadgeText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
    },
    formGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#0f172a',
    },
    rowForm: {
        flexDirection: 'row',
        gap: 12,
    },
    // Mobile Money Recommend Banner
    momoRecommendBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f5f3ff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    momoRecommendText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6d28d9',
        flexShrink: 1,
    },
    paymentMethodsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    paymentOption: {
        flex: 1,
        minWidth: 130,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    paymentOptionActive: {
        borderColor: '#8b72e6',
        backgroundColor: '#f3e8ff',
    },
    paymentOptionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    paymentOptionTextActive: {
        color: '#7e22ce',
        fontWeight: '900',
    },
    // Mobile Money Icons
    momoIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tmoneyIcon: {
        backgroundColor: '#fbbf24',
    },
    floozIcon: {
        backgroundColor: '#3b82f6',
    },
    momoIconText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 14,
    },
    // Mobile Money Input Section
    momoInputWrapper: {
        marginTop: 4,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9d5ff',
        gap: 12,
    },
    momoInputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    momoInputTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },
    momoInputSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    momoPhoneInput: {
        borderColor: '#8b72e6',
        borderWidth: 2,
        backgroundColor: '#faf5ff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    paydunyaBadge: {
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        alignItems: 'center',
    },
    paydunyaBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#166534',
    },
    cardInputWrapper: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    reviewContainer: {
        flex: 1,
    },
    reviewContainerMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        marginTop: 0,
    },
    reviewCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    reviewCardMobile: {
        padding: 16,
    },
    reviewTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 16,
    },
    miniItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    miniItemQty: {
        fontSize: 13,
        fontWeight: '800',
        color: '#8b72e6',
        width: 30,
    },
    miniItemName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    miniItemPrice: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#cbd5e1',
        marginVertical: 14,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    calcLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    calcValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },
    discountText: {
        color: '#16a34a',
        fontWeight: '800',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },
    xofRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#faf5ff',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    xofLabel: {
        fontSize: 12,
        color: '#6d28d9',
        fontWeight: '700',
    },
    xofValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#6d28d9',
    },
    placeOrderBtn: {
        backgroundColor: '#111111',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    placeOrderBtnMomo: {
        backgroundColor: '#7c3aed',
    },
    placeOrderBtnLoading: {
        backgroundColor: '#64748b',
    },
    orderError: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 12,
    },
    placeOrderBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    paydunyaNote: {
        marginTop: 12,
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 17,
    },
    paymentMessage: {
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#ecfdf5',
        color: '#047857',
        fontSize: 13,
        lineHeight: 19,
    },
});
