import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { LocalizedText as Text } from '../context/LanguageContext';
import { useShop } from '../context/ShopContext';
import { FlashSaleTimer } from '../components/FlashSaleTimer';
import { HeroBanner } from '../components/HeroBanner';
import { FilterBar } from '../components/FilterBar';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';

export const ShopScreen: React.FC = () => {
    const { products, filterState } = useShop();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [isCompactView, setIsCompactView] = useState(false);
    // On mobile, reduce side padding so products have more room
    const horizontalPad = isLargeScreen ? 20 : 12;

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

    // Filter & Sort Logic
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            // Category filter
            if (filterState.category !== 'ALL') {
                if (filterState.category === 'NEW IN' && !p.isNewIn) return false;
                if (filterState.category !== 'NEW IN' && p.category !== filterState.category)
                    return false;
            }

            // Search Query
            if (filterState.searchQuery.trim().length > 0) {
                const query = filterState.searchQuery.toLowerCase();
                const matchName = p.name.toLowerCase().includes(query);
                const matchBrand = p.brand.toLowerCase().includes(query);
                const matchCategory = p.category.toLowerCase().includes(query);
                if (!matchName && !matchBrand && !matchCategory) return false;
            }

            // Product Type
            if (filterState.productType !== 'ALL' && p.productType !== filterState.productType) {
                return false;
            }

            if (
                filterState.selectedColor !== 'ALL' &&
                !p.colors.some((color) => color.name === filterState.selectedColor)
            ) {
                return false;
            }

            // Max Price
            if (p.price > filterState.maxPrice) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (filterState.sortBy === 'price-low') return a.price - b.price;
            if (filterState.sortBy === 'price-high') return b.price - a.price;
            if (filterState.sortBy === 'rating') return b.rating - a.rating;
            if (filterState.sortBy === 'newest') return (b.isNewIn ? 1 : 0) - (a.isNewIn ? 1 : 0);
            return 0;
        });
    }, [products, filterState]);

    return (
        <View style={styles.screenContainer}>
            <FlashSaleTimer />

            <ScrollView
                bounces={false}
                alwaysBounceVertical={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.mainScrollContent, { paddingHorizontal: horizontalPad }]}
            >
                <View style={styles.catalogContent}>
                    <HeroBanner horizontalBleed={horizontalPad} />

                    <FilterBar
                        isCompactView={isCompactView}
                        onToggleCompactView={() => setIsCompactView(!isCompactView)}
                    />

                    {filteredProducts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptySubtitle}>
                                Try clearing some filters or changing your search criteria.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.gridContainer}>
                            {filteredProducts.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </View>
                    )}
                </View>
                <Footer horizontalBleed={horizontalPad} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    mainScrollContent: {
        paddingVertical: 0,
    },
    catalogContent: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        marginVertical: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});
