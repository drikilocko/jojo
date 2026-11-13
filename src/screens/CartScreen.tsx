import React, { useEffect, useState } from 'react';
import {
    Platform,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, useLanguage, translateText } from '../context/LanguageContext';
import { Feather } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { Header } from '../components/Header';

export const CartScreen: React.FC = () => {
    const {
        cart,
        removeFromCart,
        updateCartQuantity,
        cartSubtotal,
        discount,
        shippingCost,
        cartTotal,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        formatPrice,
        navigateTo,
    } = useShop();

    const { width } = useWindowDimensions();
    const { language } = useLanguage();
    const isLargeScreen = width >= 1024;

    const [inputCode, setInputCode] = useState('');
    const [promoFeedback, setPromoFeedback] = useState<{ success?: boolean; message?: string }>({});

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const root = document.documentElement;
        const body = document.body;
        const previousRootBehavior = root.style.overscrollBehavior;
        const previousBodyBehavior = body.style.overscrollBehavior;
        root.style.overscrollBehavior = 'none';
        body.style.overscrollBehavior = 'none';

        return () => {
            root.style.overscrollBehavior = previousRootBehavior;
            body.style.overscrollBehavior = previousBodyBehavior;
        };
    }, []);

    const handleApplyPromo = () => {
        if (!inputCode.trim()) return;
        const res = applyPromoCode(inputCode);
        setPromoFeedback(res);
    };

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView
                bounces={false}
                alwaysBounceVertical={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    !isLargeScreen && styles.scrollContentMobile,
                ]}
            >
                {/* Header Breadcrumb */}
                <View style={[styles.topHeader, !isLargeScreen && styles.topHeaderMobile]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigateTo('shop')}>
                        <Feather name="arrow-left" size={16} color="#475569" />
                        <Text style={styles.backBtnText}>Continue Shopping</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>
                        {language === 'fr' ? `Panier (${cart.length})` : `Shopping Bag (${cart.length})`}
                    </Text>
                </View>

                {cart.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="shopping-bag" size={54} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Your bag is empty</Text>
                        <Text style={styles.emptySub}>
                            Explore our electronics and find your next favorite device.
                        </Text>
                        <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigateTo('shop')}>
                            <Text style={styles.shopNowBtnText}>SHOP NOW</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.cartLayout,
                            isLargeScreen ? styles.cartLayoutRow : styles.cartLayoutMobile,
                        ]}
                    >
                        {/* Left Items List */}
                        <View style={[styles.itemsListContainer, !isLargeScreen && styles.itemsListContainerMobile]}>
                            {cart.map((item, idx) => (
                                <View key={`${item.product.id}-${item.selectedColor.name}-${idx}`} style={styles.cartItemCard}>
                                    <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />

                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemBrand}>{item.product.brand}</Text>
                                        <Text style={styles.itemName} numberOfLines={1}>
                                            {translateText(item.product.name, language)}
                                        </Text>

                                        <View style={styles.itemSpecsRow}>
                                            <View style={styles.colorSpecRow}>
                                                <Text style={styles.specBadge}>
                                                    {language === 'fr'
                                                        ? `Couleur : ${translateText(item.selectedColor.name, language)}`
                                                        : `Color: ${item.selectedColor.name}`}
                                                </Text>
                                                <View style={[styles.colorDot, { backgroundColor: item.selectedColor.hex }]} />
                                            </View>
                                        </View>

                                        <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
                                    </View>

                                    {/* Quantity & Delete Actions */}
                                    <View style={styles.itemActionsRight}>
                                        <TouchableOpacity
                                            onPress={() => removeFromCart(item.product.id, item.selectedColor.name)}
                                            style={styles.deleteBtn}
                                        >
                                            <Feather name="trash-2" size={16} color="#ef4444" />
                                        </TouchableOpacity>

                                        <View style={styles.qtyBox}>
                                            <TouchableOpacity
                                                onPress={() => updateCartQuantity(item.product.id, item.selectedColor.name, -1)}
                                                style={styles.qtyBtn}
                                            >
                                                <Feather name="minus" size={14} color="#111" />
                                            </TouchableOpacity>

                                            <Text style={styles.qtyValue}>{item.quantity}</Text>

                                            <TouchableOpacity
                                                onPress={() => updateCartQuantity(item.product.id, item.selectedColor.name, 1)}
                                                style={styles.qtyBtn}
                                            >
                                                <Feather name="plus" size={14} color="#111" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Right Order Summary & Promo Code Box */}
                        <View style={[styles.summaryCard, !isLargeScreen && styles.summaryCardMobile]}>
                            <Text style={styles.summaryTitle}>Order Summary</Text>

                            {/* Promo Code Input Box */}
                            <View style={styles.promoSection}>
                                <Text style={styles.promoLabel}>Promo Code / Gift Voucher</Text>
                                <View style={styles.promoInputRow}>
                                    <TextInput
                                        style={styles.promoInput}
                                        placeholder="Try code: 20100"
                                        placeholderTextColor="#94a3b8"
                                        value={inputCode}
                                        onChangeText={setInputCode}
                                    />
                                    <TouchableOpacity style={styles.applyPromoBtn} onPress={handleApplyPromo}>
                                        <Text style={styles.applyPromoBtnText}>APPLY</Text>
                                    </TouchableOpacity>
                                </View>

                                {appliedPromo && (
                                    <View style={styles.activePromoBadge}>
                                        <Feather name="check-circle" size={14} color="#16a34a" />
                                        <Text style={styles.activePromoText}>
                                            {language === 'fr'
                                                ? `Code ${appliedPromo} appliqué`
                                                : `Code ${appliedPromo} applied`}
                                        </Text>
                                        <TouchableOpacity onPress={removePromoCode}>
                                            <Feather name="x" size={14} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {promoFeedback.message && !appliedPromo && (
                                    <Text style={[styles.feedbackMsg, promoFeedback.success ? styles.feedbackSuccess : styles.feedbackError]}>
                                        {promoFeedback.message}
                                    </Text>
                                )}
                            </View>

                            {/* Cost Calculations */}
                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Subtotal</Text>
                                <Text style={styles.calcValue}>{formatPrice(cartSubtotal)}</Text>
                            </View>

                            {discount > 0 && (
                                <View style={styles.calcRow}>
                                    <Text style={[styles.calcLabel, styles.discountText]}>Promo Discount</Text>
                                    <Text style={[styles.calcValue, styles.discountText]}>-{formatPrice(discount)}</Text>
                                </View>
                            )}

                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Shipping</Text>
                                <Text style={styles.calcValue}>
                                    {shippingCost === 0 ? 'FREE Express' : formatPrice(shippingCost)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Estimated Total</Text>
                                <Text style={styles.totalValue}>{formatPrice(cartTotal)}</Text>
                            </View>

                            {/* Checkout Button */}
                            <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigateTo('checkout')}>
                                <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
                                <Feather name="arrow-right" size={18} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
        paddingTop: 16,
        paddingBottom: 24,
    },
    scrollContentMobile: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    topHeaderMobile: {
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 16,
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
    },
    shopNowBtn: {
        backgroundColor: '#111111',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 14,
    },
    shopNowBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 13,
    },
    cartLayout: {
        gap: 24,
    },
    cartLayoutRow: {
        flexDirection: 'row',
    },
    cartLayoutMobile: {
        alignItems: 'stretch',
        gap: 8,
    },
    itemsListContainer: {
        flex: 2,
        gap: 16,
    },
    itemsListContainerMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
    },
    cartItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    itemImage: {
        width: 90,
        height: 110,
        borderRadius: 16,
        backgroundColor: '#cbd5e1',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    itemBrand: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8b72e6',
        textTransform: 'uppercase',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 2,
        marginBottom: 6,
    },
    itemSpecsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    specBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    colorSpecRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
    },
    itemActionsRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 110,
    },
    deleteBtn: {
        padding: 6,
    },
    qtyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    qtyBtn: {
        padding: 8,
    },
    qtyValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        paddingHorizontal: 8,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    summaryCardMobile: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        marginTop: 0,
        padding: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 16,
    },
    promoSection: {
        marginBottom: 20,
    },
    promoLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    promoInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    promoInput: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 14,
        fontSize: 13,
        color: '#0f172a',
    },
    applyPromoBtn: {
        backgroundColor: '#111111',
        borderRadius: 14,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    applyPromoBtnText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 12,
    },
    activePromoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: 8,
    },
    activePromoText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#15803d',
    },
    feedbackMsg: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    feedbackSuccess: {
        color: '#16a34a',
    },
    feedbackError: {
        color: '#ef4444',
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    calcLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    calcValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    discountText: {
        color: '#16a34a',
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 14,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
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
    checkoutBtn: {
        backgroundColor: '#8b72e6',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    checkoutBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
