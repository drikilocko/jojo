import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LocalizedText as Text, useLanguage, translateText } from '../context/LanguageContext';
import { Feather } from '@expo/vector-icons';
import { useShop } from '../context/ShopContext';
import { FilterModal } from './FilterModal';

interface FilterBarProps {
    onToggleCompactView?: () => void;
    isCompactView?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    onToggleCompactView,
    isCompactView,
}) => {
    const { filterState, setFilterState, resetFilters, formatPrice } = useShop();
    const { language } = useLanguage();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const activeCategoryTitle =
        filterState.category === 'ALL'
            ? 'ALL PRODUCTS'
            : filterState.category;

    const handleSortToggle = () => {
        const options: ('featured' | 'price-low' | 'price-high' | 'rating' | 'newest')[] = [
            'featured',
            'price-low',
            'price-high',
            'rating',
            'newest',
        ];
        const currentIndex = options.indexOf(filterState.sortBy);
        const nextIndex = (currentIndex + 1) % options.length;
        setFilterState((prev) => ({ ...prev, sortBy: options[nextIndex] }));
    };

    const getSortLabel = () => {
        switch (filterState.sortBy) {
            case 'price-low':
                return language === 'fr' ? 'Prix : croissant' : 'Price: Low-High';
            case 'price-high':
                return language === 'fr' ? 'Prix : décroissant' : 'Price: High-Low';
            case 'rating':
                return language === 'fr' ? 'Mieux notés' : 'Top Rated';
            case 'newest':
                return language === 'fr' ? 'Nouveautés' : 'Newest Arrivals';
            default:
                return language === 'fr' ? 'Trier' : 'Sort';
        }
    };

    const activeFiltersCount = [
        filterState.productType !== 'ALL',
        filterState.selectedColor !== 'ALL',
        filterState.maxPrice < 2000,
    ].filter(Boolean).length;

    return (
        <View style={styles.container}>
            {/* Category Header */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.categoryTitle}>{activeCategoryTitle}</Text>
                    <Text style={styles.subTitle}>View more</Text>
                </View>

                {activeFiltersCount > 0 && (
                    <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
                        <Text style={styles.resetText}>
                            {language === 'fr' ? `Réinitialiser (${activeFiltersCount})` : `Reset Filters (${activeFiltersCount})`}
                        </Text>
                        <Feather name="x" size={14} color="#111111" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Pill Filter Bar */}
            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                    {/* Sort Pill */}
                    <TouchableOpacity
                        style={[styles.pill, filterState.sortBy !== 'featured' && styles.pillActive]}
                        onPress={handleSortToggle}
                        activeOpacity={0.7}
                    >
                        <Feather name="sliders" size={14} color={filterState.sortBy !== 'featured' ? '#ffffff' : '#111111'} />
                        <Text style={[styles.pillText, filterState.sortBy !== 'featured' && styles.pillTextActive]}>
                            {getSortLabel()}
                        </Text>
                        <Feather name="chevron-down" size={12} color="#737373" />
                    </TouchableOpacity>

                    {/* Product Type Pill */}
                    <TouchableOpacity
                        style={[styles.pill, filterState.productType !== 'ALL' && styles.pillActive]}
                        onPress={() => setIsModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, filterState.productType !== 'ALL' && styles.pillTextActive]}>
                            {language === 'fr'
                                ? `Type de produit${filterState.productType !== 'ALL' ? ` : ${translateText(filterState.productType, language)}` : ''}`
                                : `Product type${filterState.productType !== 'ALL' ? `: ${filterState.productType}` : ''}`}
                        </Text>
                    </TouchableOpacity>

                    {/* Color filter */}
                    <TouchableOpacity
                        style={[styles.pill, filterState.selectedColor !== 'ALL' && styles.pillActive]}
                        onPress={() => setIsModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, filterState.selectedColor !== 'ALL' && styles.pillTextActive]}>
                            {language === 'fr'
                                ? `Couleur${filterState.selectedColor !== 'ALL' ? ` : ${translateText(filterState.selectedColor, language)}` : ''}`
                                : `Colour${filterState.selectedColor !== 'ALL' ? `: ${filterState.selectedColor}` : ''}`}
                        </Text>
                    </TouchableOpacity>

                    {/* Price Range Pill */}
                    <TouchableOpacity
                        style={[styles.pill, filterState.maxPrice < 2000 && styles.pillActive]}
                        onPress={() => setIsModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, filterState.maxPrice < 2000 && styles.pillTextActive]}>
                            {language === 'fr'
                                ? `Fourchette de prix${filterState.maxPrice < 2000 ? ` < ${formatPrice(filterState.maxPrice)}` : ''}`
                                : `Price Range${filterState.maxPrice < 2000 ? ` < ${formatPrice(filterState.maxPrice)}` : ''}`}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* View Layout Toggle Button */}
                <TouchableOpacity
                    style={styles.viewToggleButton}
                    onPress={onToggleCompactView}
                    activeOpacity={0.7}
                >
                    <Feather name={isCompactView ? 'grid' : 'layout'} size={18} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Detailed Filter Drawer Modal */}
            <FilterModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    subTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#737373',
        marginTop: 2,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    resetText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111111',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pillsScroll: {
        gap: 8,
        alignItems: 'center',
        paddingRight: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d4d4d4',
    },
    pillActive: {
        borderColor: '#111111',
        backgroundColor: '#111111',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#262626',
    },
    pillTextActive: {
        color: '#ffffff',
    },
    viewToggleButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
