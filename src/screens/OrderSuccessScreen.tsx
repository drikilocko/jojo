import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { LocalizedText as Text, useLanguage, translateText } from '../context/LanguageContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { Header } from '../components/Header';

export const OrderSuccessScreen: React.FC = () => {
    const { activeOrder, formatPrice, navigateTo } = useShop();
    const { language } = useLanguage();

    if (!activeOrder) {
        return (
            <View style={styles.errorContainer}>
                <Header />
                <Text style={styles.errorText}>No active order found.</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigateTo('shop')}>
                    <Text style={styles.primaryBtnText}>RETURN TO SHOP</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const steps = [
        { key: 'placed', label: language === 'fr' ? 'Commande passée' : 'Order Placed', desc: language === 'fr' ? 'Reçue et confirmée' : 'Received & Confirmed', done: true },
        { key: 'processing', label: language === 'fr' ? 'En préparation' : 'Processing', desc: language === 'fr' ? 'Préparation du colis' : 'Preparing package', done: true },
        { key: 'shipped', label: language === 'fr' ? 'En cours de livraison' : 'Out for Delivery', desc: language === 'fr' ? 'Le livreur est en route' : 'Courier on the way', done: false },
        { key: 'delivered', label: language === 'fr' ? 'Livrée' : 'Delivered', desc: language === 'fr' ? 'Prévue : demain à 17 h' : 'Est: Tomorrow 5 PM', done: false },
    ];

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Celebration Top Card */}
                <View style={styles.successHeaderCard}>
                    <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={36} color="#ffffff" />
                    </View>
                    <Text style={styles.thankYouText}>Thank you for your order!</Text>
                    <Text style={styles.orderIdText}>
                        {language === 'fr' ? `Commande n° ${activeOrder.id}` : `Order #${activeOrder.id}`}
                    </Text>
                    <Text style={styles.estimatedText}>
                        {language === 'fr' ? 'Livraison estimée : ' : 'Estimated Delivery: '}
                        <Text style={styles.estHighlight}>{activeOrder.estimatedDelivery}</Text>
                    </Text>
                </View>

                {/* Live Tracking Timeline */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Order Status Tracker</Text>

                    <View style={styles.timelineWrapper}>
                        {steps.map((step, idx) => (
                            <View key={step.key} style={styles.stepItem}>
                                <View style={styles.stepIndicatorCol}>
                                    <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                                        <Feather
                                            name={step.done ? 'check' : 'clock'}
                                            size={12}
                                            color={step.done ? '#ffffff' : '#94a3b8'}
                                        />
                                    </View>
                                    {idx < steps.length - 1 && (
                                        <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                                    )}
                                </View>
                                <View style={styles.stepTextCol}>
                                    <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                                        {step.label}
                                    </Text>
                                    <Text style={styles.stepDesc}>{step.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Order Details & Summary */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                        {language === 'fr' ? `Articles commandés (${activeOrder.items.length})` : `Order Items (${activeOrder.items.length})`}
                    </Text>

                    {activeOrder.items.map((item, idx) => (
                        <View key={idx} style={styles.orderItemRow}>
                            <Image source={{ uri: item.product.images[0] }} style={styles.itemThumb} />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemBrand}>{item.product.brand}</Text>
                                <Text style={styles.itemName}>{translateText(item.product.name, language)}</Text>
                                <Text style={styles.itemSpecs}>
                                    {language === 'fr'
                                        ? `Couleur : ${translateText(item.selectedColor.name, language)} | Qté : ${item.quantity}`
                                        : `Color: ${item.selectedColor.name} | Qty: ${item.quantity}`}
                                </Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                {formatPrice(item.product.price * item.quantity)}
                            </Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Paid</Text>
                        <Text style={styles.summaryTotal}>{formatPrice(activeOrder.total)}</Text>
                    </View>
                    <Text style={styles.paymentMethodInfo}>
                        {language === 'fr'
                            ? `Payé par ${activeOrder.paymentMethod.toUpperCase()} • Livraison à ${activeOrder.shippingAddress.address}, ${activeOrder.shippingAddress.city}`
                            : `Paid via ${activeOrder.paymentMethod.toUpperCase()} • Shipping to ${activeOrder.shippingAddress.address}, ${activeOrder.shippingAddress.city}`}
                    </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigateTo('shop')}>
                    <Text style={styles.primaryBtnText}>CONTINUE SHOPPING</Text>
                    <Feather name="shopping-bag" size={18} color="#ffffff" />
                </TouchableOpacity>
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
        paddingVertical: 20,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 20,
        marginBottom: 16,
    },
    successHeaderCard: {
        backgroundColor: '#ffc5d3',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 20,
    },
    checkCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    thankYouText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    orderIdText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#8b72e6',
        marginTop: 4,
    },
    estimatedText: {
        fontSize: 14,
        color: '#334155',
        marginTop: 10,
        fontWeight: '600',
    },
    estHighlight: {
        fontWeight: '900',
        color: '#0f172a',
    },
    sectionCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 16,
    },
    timelineWrapper: {
        paddingLeft: 8,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 54,
    },
    stepIndicatorCol: {
        alignItems: 'center',
        marginRight: 16,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    stepDotDone: {
        backgroundColor: '#8b72e6',
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 4,
    },
    stepLineDone: {
        backgroundColor: '#8b72e6',
    },
    stepTextCol: {
        paddingTop: 2,
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94a3b8',
    },
    stepLabelDone: {
        color: '#0f172a',
    },
    stepDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    orderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemThumb: {
        width: 54,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#cbd5e1',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 14,
    },
    itemBrand: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8b72e6',
        textTransform: 'uppercase',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    itemSpecs: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#cbd5e1',
        marginVertical: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
    },
    summaryTotal: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },
    paymentMethodInfo: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 6,
    },
    primaryBtn: {
        backgroundColor: '#111111',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    primaryBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
