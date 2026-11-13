import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ImageBackground,
    useWindowDimensions,
} from 'react-native';
import { LocalizedText as Text } from '../context/LanguageContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const ExploreScreen: React.FC = () => {
    const { navigateTo, setFilterState } = useShop();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const handleCategoryClick = (cat: string) => {
        setFilterState((prev) => ({ ...prev, category: cat }));
        navigateTo('shop');
    };

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* =========================================================================
            SECTION 1: "ALWAYS ZONE DE PAPY" BRAND BANNER
            ========================================================================= */}
                <View style={styles.alwaysBanner}>
                    <View style={styles.stripeDecorationRow}>
                        {[...Array(14)].map((_, i) => (
                            <View key={i} style={styles.stripeBar} />
                        ))}
                    </View>

                    <View style={styles.alwaysContentRow}>
                        <View style={styles.alwaysLeftCol}>
                            <Text style={styles.alwaysTitle}>Always Zone de Papy</Text>
                            <Text style={styles.alwaysSub}>Discover useful technology for work, play, and everyday life.</Text>
                            <TouchableOpacity style={styles.alwaysLearnBtn} onPress={() => navigateTo('shop')}>
                                <Text style={styles.alwaysLearnBtnText}>Learn More</Text>
                                <Feather name="arrow-right" size={16} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.alwaysRightLogoBadge}>
                            <Text style={styles.alwaysBadgeTagline}>IT ALWAYS WILL BE</Text>
                            <View style={styles.alwaysBadgeBox}>
                                <Text style={styles.alwaysBadgeMainText}>Zone de Papy</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* =========================================================================
            SECTION 2: FEATURED ELECTRONICS
            ========================================================================= */}
                <View style={styles.heroSection}>
                    <ImageBackground
                        source={{
                            uri: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
                        }}
                        style={styles.heroBg}
                        imageStyle={styles.heroBgImage}
                    >
                        <View style={styles.heroOverlay}>
                            <View style={styles.exclusiveTag}>
                                <Text style={styles.exclusiveTagText}>EXCLUSIVE</Text>
                            </View>

                            <Text style={styles.heroTitle}>Technology for every day</Text>
                            <Text style={styles.heroDesc}>
                                Explore smartphones, computers, audio, and accessories selected for you.
                            </Text>

                            <View style={styles.heroButtonsRow}>
                                <TouchableOpacity
                                    style={styles.heroBtn}
                                    onPress={() => handleCategoryClick('SMARTPHONES')}
                                >
                                    <Text style={styles.heroBtnText}>Shop smartphones</Text>
                                    <Feather name="arrow-right" size={16} color="#000000" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.heroBtn}
                                    onPress={() => handleCategoryClick('COMPUTERS')}
                                >
                                    <Text style={styles.heroBtnText}>Shop computers</Text>
                                    <Feather name="arrow-right" size={16} color="#000000" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.heroBtn}
                                    onPress={() => handleCategoryClick('AUDIO')}
                                >
                                    <Text style={styles.heroBtnText}>Shop audio</Text>
                                    <Feather name="arrow-right" size={16} color="#000000" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.heroBtn}
                                    onPress={() => handleCategoryClick('ACCESSORIES')}
                                >
                                    <Text style={styles.heroBtnText}>Shop accessories</Text>
                                    <Feather name="arrow-right" size={16} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* =========================================================================
            SECTION 3: SHOP OUR TOP BRANDS GRID
            ========================================================================= */}
                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeaderTitle}>Shop by electronics category</Text>

                    <View style={styles.brandsGrid}>
                        {[
                            {
                                id: 'smartphones',
                                name: 'Smartphones',
                                image:
                                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
                                logo: '5G',
                            },
                            {
                                id: 'computers',
                                name: 'Computers',
                                image:
                                    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
                                logo: 'WORK',
                            },
                            {
                                id: 'audio',
                                name: 'Audio',
                                image:
                                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
                                logo: 'SOUND',
                            },
                            {
                                id: 'accessories',
                                name: 'Accessories',
                                image:
                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
                                logo: 'TECH',
                            },
                        ].map((brand) => (
                            <TouchableOpacity
                                key={brand.id}
                                style={[styles.brandCard, isMobile ? { width: '48%' } : { width: '23.5%' }]}
                                onPress={() => handleCategoryClick(brand.name.toUpperCase())}
                                activeOpacity={0.9}
                            >
                                <View style={styles.brandImageWrapper}>
                                    <Image source={{ uri: brand.image }} style={styles.brandImage} />
                                    <View style={styles.brandBadgeTopRight}>
                                        <Text style={styles.brandBadgeText}>{brand.name.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.brandCardFooter}>
                                    <Text style={styles.brandCardName}>{brand.name}</Text>
                                    <Feather name="arrow-right" size={18} color="#000000" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* =========================================================================
            SECTION 4: SHOP BY CATEGORY GRID
            ========================================================================= */}
                <View style={styles.sectionBlock}>
                    <View style={styles.categoryGrid}>
                        {[
                            {
                                id: 'GAMING',
                                title: 'Gaming',
                                image:
                                    'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80',
                            },
                            {
                                id: 'AUDIO',
                                title: 'Headphones & Audio',
                                image:
                                    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
                            },
                            {
                                id: 'COMPUTERS',
                                title: 'Tablets & Laptops',
                                image:
                                    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
                            },
                            {
                                id: 'ACCESSORIES',
                                title: 'Smart accessories',
                                image:
                                    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
                            },
                        ].map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categoryCard, isMobile ? { width: '48%' } : { width: '23.5%' }]}
                                onPress={() => handleCategoryClick(cat.id)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.catImageWrapper}>
                                    <Image source={{ uri: cat.image }} style={styles.catImage} />
                                </View>
                                <View style={styles.catCardFooter}>
                                    <Text style={styles.catCardTitle}>{cat.title}</Text>
                                    <Feather name="arrow-right" size={18} color="#000000" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* =========================================================================
            SECTION 5: PAPY FLX REWARDS BANNER & QUICK HELP SERVICES BAR
            ========================================================================= */}
                <View style={styles.rewardsSection}>
                    <ImageBackground
                        source={{
                            uri: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
                        }}
                        style={styles.rewardsBg}
                        imageStyle={{ borderRadius: 0 }}
                    >
                        <View style={styles.rewardsOverlay}>
                            <Text style={styles.rewardsHeadline}>Rewards</Text>
                            <Text style={styles.rewardsSub}>FLX Members get exclusive savings and rewards.</Text>

                            <View style={styles.rewardsButtonsRow}>
                                <TouchableOpacity
                                    style={styles.rewardsBtnWhite}
                                    onPress={() => navigateTo('account')}
                                >
                                    <Text style={styles.rewardsBtnWhiteText}>Learn more about FLX</Text>
                                    <Feather name="arrow-right" size={16} color="#000000" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.rewardsBtnWhite}
                                    onPress={() => navigateTo('account')}
                                >
                                    <Text style={styles.rewardsBtnWhiteText}>Join FLX for Free</Text>
                                    <Feather name="arrow-right" size={16} color="#000000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* Service Help Icons Bar */}
                <View style={styles.servicesBar}>
                    {[
                        { id: '1', title: 'Contact Us', icon: 'phone-call' },
                        { id: '2', title: 'Order Status', icon: 'package' },
                        { id: '3', title: 'Shipping Info', icon: 'truck' },
                        { id: '4', title: 'Store Pickup', icon: 'map-pin' },
                        { id: '5', title: 'Returns-Exchanges', icon: 'refresh-cw' },
                        { id: '6', title: 'Help', icon: 'help-circle' },
                    ].map((service) => (
                        <TouchableOpacity key={service.id} style={styles.serviceItem}>
                            <Feather name={service.icon as any} size={24} color="#000000" style={{ marginBottom: 8 }} />
                            <Text style={styles.serviceTitle}>{service.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Footer />
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
        paddingBottom: 60,
    },

    /* SECTION 1: ALWAYS BANNER */
    alwaysBanner: {
        backgroundColor: '#161616',
        position: 'relative',
        paddingVertical: 28,
        paddingHorizontal: 24,
        overflow: 'hidden',
    },
    stripeDecorationRow: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        gap: 8,
    },
    stripeBar: {
        width: 24,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        transform: [{ skewX: '-20deg' }],
    },
    alwaysContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        flexWrap: 'wrap',
        gap: 20,
    },
    alwaysLeftCol: {
        flex: 1,
        minWidth: 280,
    },
    alwaysTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    alwaysSub: {
        fontSize: 14,
        color: '#cccccc',
        marginTop: 6,
        fontWeight: '400',
    },
    alwaysLearnBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 2,
        alignSelf: 'flex-start',
        marginTop: 16,
    },
    alwaysLearnBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#000000',
    },
    alwaysRightLogoBadge: {
        alignItems: 'flex-end',
    },
    alwaysBadgeTagline: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    alwaysBadgeBox: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    alwaysBadgeMainText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000000',
        letterSpacing: -1,
    },

    /* SECTION 2: HERO BANNER */
    heroSection: {
        width: '100%',
        height: 480,
        backgroundColor: '#000000',
    },
    heroBg: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    heroBgImage: {
        opacity: 0.85,
    },
    heroOverlay: {
        paddingHorizontal: 32,
        paddingVertical: 40,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    exclusiveTag: {
        backgroundColor: '#d8b4fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        borderRadius: 2,
        marginBottom: 12,
    },
    exclusiveTagText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#4c1d95',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
    },
    heroDesc: {
        fontSize: 15,
        color: '#ffffff',
        maxWidth: 550,
        marginTop: 10,
        lineHeight: 22,
    },
    heroButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 24,
    },
    heroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ffffff',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 2,
    },
    heroBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#000000',
    },

    /* SECTION 3: TOP BRANDS */
    sectionBlock: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 48,
    },
    sectionHeaderTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#000000',
        marginBottom: 20,
    },
    brandsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    brandCard: {
        backgroundColor: '#ffffff',
    },
    brandImageWrapper: {
        width: '100%',
        height: 220,
        backgroundColor: '#f1f5f9',
        position: 'relative',
        overflow: 'hidden',
    },
    brandImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    brandBadgeTopRight: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    brandBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000000',
    },
    brandCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    brandCardName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#000000',
    },

    /* SECTION 4: CATEGORY GRID */
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    categoryCard: {
        backgroundColor: '#ffffff',
    },
    catImageWrapper: {
        width: '100%',
        height: 320,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
    },
    catImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    catCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    catCardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#000000',
    },

    /* SECTION 5: REWARDS BANNER & HELP BAR */
    rewardsSection: {
        width: '100%',
        height: 380,
        backgroundColor: '#000000',
        marginTop: 48,
    },
    rewardsBg: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
    },
    rewardsOverlay: {
        paddingHorizontal: 32,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },
    rewardsHeadline: {
        fontSize: 48,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
    },
    rewardsSub: {
        fontSize: 16,
        color: '#ffffff',
        marginTop: 8,
        fontWeight: '500',
    },
    rewardsButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 24,
    },
    rewardsBtnWhite: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 2,
    },
    rewardsBtnWhiteText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#000000',
    },

    /* SERVICES HELP BAR */
    servicesBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#f8fafc',
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        marginTop: 32,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    serviceItem: {
        flex: 1,
        minWidth: 140,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
    },
    serviceTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#000000',
    },
});
