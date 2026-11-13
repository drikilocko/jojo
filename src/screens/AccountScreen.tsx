import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, useLanguage } from '../context/LanguageContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { Header } from '../components/Header';
import { getErrorMessage } from '../lib/supabase';

export const AccountScreen: React.FC = () => {
    const { user, logout, orders, navigateTo, formatPrice, saveAddress, currency, setCurrencyCode } = useShop();

    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'settings'>('profile');
    const { language, setLanguage } = useLanguage();

    // Address edit state
    const [editingAddress, setEditingAddress] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [savedAddr, setSavedAddr] = useState(
        user?.savedAddress || {
            fullName: user?.name || '',
            address: '',
            city: '',
            postalCode: '',
            phone: '',
        }
    );

    const handleSaveAddress = async () => {
        setAddressError(null);
        setSavingAddress(true);
        try {
            await saveAddress(savedAddr);
            setEditingAddress(false);
        } catch (error) {
            setAddressError(getErrorMessage(error));
        } finally {
            setSavingAddress(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* User Top Card */}
                <View style={styles.userCard}>
                    <Image
                        source={{
                            uri:
                                user?.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.userInfoCol}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{user?.name || 'Alex Morgan'}</Text>
                            <View style={styles.vipBadge}>
                                <Ionicons name="sparkles" size={12} color="#7e22ce" />
                                <Text style={styles.vipBadgeText}>VIP MEMBER</Text>
                            </View>
                        </View>
                        <Text style={styles.userEmail}>{user?.email || 'alex.morgan@gmail.com'}</Text>
                        <Text style={styles.loginMethod}>
                            Logged in via {user?.provider === 'google' ? 'Google Account 🌐' : 'Email & Password ✉️'}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Feather name="log-out" size={16} color="#ef4444" />
                        <Text style={styles.logoutBtnText}>LOG OUT</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabRow}>
                    {[
                        { id: 'profile', label: 'MY PROFILE', icon: 'user' },
                        { id: 'orders', label: `ORDERS (${orders.length})`, icon: 'package' },
                        { id: 'addresses', label: 'ADDRESSES', icon: 'map-pin' },
                        { id: 'settings', label: 'SETTINGS', icon: 'settings' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
                            onPress={() => setActiveTab(tab.id as any)}
                        >
                            <Feather
                                name={tab.icon as any}
                                size={14}
                                color={activeTab === tab.id ? '#ffffff' : '#64748b'}
                            />
                            <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* TAB 1: Profile Summary */}
                {activeTab === 'profile' && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Account Details & Overview</Text>

                        <View style={styles.detailGrid}>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>Full Name</Text>
                                <Text style={styles.detailValue}>{user?.name || 'Alex Morgan'}</Text>
                            </View>

                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>Email</Text>
                                <Text style={styles.detailValue}>{user?.email || 'alex.morgan@gmail.com'}</Text>
                            </View>

                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>Member Since</Text>
                                <Text style={styles.detailValue}>September 2026</Text>
                            </View>

                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>Reward Points</Text>
                                <Text style={styles.detailValueHighlight}>1,450 PAPY Points ⭐</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigateTo('shop')}>
                            <Text style={styles.shopNowBtnText}>EXPLORE NEW ARRIVALS</Text>
                            <Feather name="arrow-right" size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* TAB 2: Orders History */}
                {activeTab === 'orders' && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Order History & Live Tracking</Text>

                        {orders.length === 0 ? (
                            <Text style={styles.emptyText}>No orders placed yet.</Text>
                        ) : (
                            orders.map((o) => (
                                <View key={o.id} style={styles.orderCard}>
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={styles.orderIdText}>Order #{o.id}</Text>
                                            <Text style={styles.orderDateText}>{o.date}</Text>
                                        </View>
                                        <View style={styles.statusBadge}>
                                            <Text style={styles.statusBadgeText}>{o.status.toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderItemsList}>
                                        {o.items.map((it, idx) => (
                                            <View key={idx} style={styles.orderItemRow}>
                                                <Image source={{ uri: it.product.images[0] }} style={styles.itemThumb} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.itemBrand}>{it.product.brand}</Text>
                                                    <Text style={styles.itemName}>{it.product.name}</Text>
                                                    <Text style={styles.itemSpecs}>
                                                        Qty: {it.quantity}
                                                    </Text>
                                                </View>
                                                <Text style={styles.itemPrice}>{formatPrice(it.product.price * it.quantity)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.orderFooter}>
                                        <Text style={styles.totalText}>Total: {formatPrice(o.total)}</Text>
                                        <TouchableOpacity
                                            style={styles.trackOrderBtn}
                                            onPress={() => navigateTo('order-success')}
                                        >
                                            <Text style={styles.trackOrderBtnText}>TRACK ORDER</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* TAB 3: Saved Addresses */}
                {activeTab === 'addresses' && (
                    <View style={styles.sectionCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.sectionTitle}>Saved Shipping Address</Text>
                            <TouchableOpacity onPress={() => setEditingAddress(!editingAddress)}>
                                <Text style={styles.editText}>{editingAddress ? 'CANCEL' : 'EDIT ADDRESS'}</Text>
                            </TouchableOpacity>
                        </View>

                        {editingAddress ? (
                            <View style={styles.addressForm}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Recipient Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={savedAddr.fullName}
                                        onChangeText={(val) => setSavedAddr({ ...savedAddr, fullName: val })}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Street Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={savedAddr.address}
                                        onChangeText={(val) => setSavedAddr({ ...savedAddr, address: val })}
                                    />
                                </View>
                                <View style={styles.rowForm}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>City</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={savedAddr.city}
                                            onChangeText={(val) => setSavedAddr({ ...savedAddr, city: val })}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Postal Code</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={savedAddr.postalCode}
                                            onChangeText={(val) => setSavedAddr({ ...savedAddr, postalCode: val })}
                                        />
                                    </View>
                                </View>
                                {addressError ? <Text style={styles.addressError}>{addressError}</Text> : null}
                                <TouchableOpacity
                                    style={styles.saveAddrBtn}
                                    onPress={handleSaveAddress}
                                    disabled={savingAddress}
                                >
                                    <Text style={styles.saveAddrBtnText}>{savingAddress ? 'SAVING...' : 'SAVE ADDRESS'}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.addressBox}>
                                <Ionicons name="location" size={20} color="#8b72e6" style={{ marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addrName}>{savedAddr.fullName}</Text>
                                    <Text style={styles.addrText}>{savedAddr.address}</Text>
                                    <Text style={styles.addrText}>
                                        {savedAddr.city}, {savedAddr.postalCode}
                                    </Text>
                                    <Text style={styles.addrPhone}>Phone: {savedAddr.phone}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* TAB 4: Settings & Language */}
                {activeTab === 'settings' && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>App Preferences & Language</Text>

                        <View style={styles.settingRow}>
                            <View>
                                <Text style={styles.settingLabel}>Display Language / Langue</Text>
                                <Text style={styles.settingSub}>Select your preferred interface language</Text>
                            </View>
                            <View style={styles.langToggle}>
                                <TouchableOpacity
                                    style={[styles.langBtn, language === 'fr' && styles.langBtnActive]}
                                    onPress={() => {
                                        setLanguage('fr');
                                        if (currency.code === 'USD') {
                                            setCurrencyCode('FCFA');
                                        }
                                    }}
                                >
                                    <Text style={[styles.langBtnText, language === 'fr' && styles.langBtnTextActive]}>
                                        🇫🇷 FR
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                                    onPress={() => setLanguage('en')}
                                >
                                    <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                                        🇬🇧 EN
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
        paddingVertical: 20,
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    userCard: {
        backgroundColor: '#ffc5d3',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    userInfoCol: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
    },
    vipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    vipBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7e22ce',
    },
    userEmail: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '600',
        marginTop: 2,
    },
    loginMethod: {
        fontSize: 11,
        color: '#475569',
        marginTop: 4,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
    },
    logoutBtnText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#ef4444',
    },
    tabRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    tabChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tabChipActive: {
        backgroundColor: '#111111',
        borderColor: '#111111',
    },
    tabChipText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
    },
    tabChipTextActive: {
        color: '#ffffff',
    },
    sectionCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 16,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    detailBox: {
        flex: 1,
        minWidth: 180,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 4,
    },
    detailValueHighlight: {
        fontSize: 15,
        fontWeight: '900',
        color: '#8b72e6',
        marginTop: 4,
    },
    shopNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#111111',
        paddingVertical: 14,
        borderRadius: 14,
    },
    shopNowBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 13,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        paddingVertical: 20,
    },
    orderCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIdText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },
    orderDateText: {
        fontSize: 11,
        color: '#64748b',
    },
    statusBadge: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#7e22ce',
    },
    orderItemsList: {
        gap: 8,
        marginBottom: 12,
    },
    orderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemThumb: {
        width: 44,
        height: 52,
        borderRadius: 10,
    },
    itemBrand: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8b72e6',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
    },
    itemSpecs: {
        fontSize: 11,
        color: '#64748b',
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    totalText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },
    trackOrderBtn: {
        backgroundColor: '#8b72e6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    trackOrderBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 11,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    editText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8b72e6',
    },
    addressBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    addrName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },
    addrText: {
        fontSize: 13,
        color: '#475569',
        marginTop: 2,
    },
    addrPhone: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 6,
    },
    addressForm: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
    },
    rowForm: {
        flexDirection: 'row',
        gap: 12,
    },
    saveAddrBtn: {
        backgroundColor: '#111111',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    addressError: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
    },
    saveAddrBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 12,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    settingSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    langToggle: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 3,
    },
    langBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    langBtnActive: {
        backgroundColor: '#111111',
    },
    langBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
    },
    langBtnTextActive: {
        color: '#ffffff',
    },
});
