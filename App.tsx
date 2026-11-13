import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
    Montserrat_400Regular,
} from '@expo-google-fonts/montserrat/400Regular';
import {
    Montserrat_500Medium,
} from '@expo-google-fonts/montserrat/500Medium';
import {
    Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat/600SemiBold';
import {
    Montserrat_700Bold,
} from '@expo-google-fonts/montserrat/700Bold';
import {
    Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat/800ExtraBold';
import {
    Montserrat_900Black,
} from '@expo-google-fonts/montserrat/900Black';
import { ShopProvider, useShop } from './src/context/ShopContext';
import { GateScreen } from './src/screens/GateScreen';
import { QuickPaymentScreen } from './src/screens/QuickPaymentScreen';
import { VideoScreen } from './src/screens/VideoScreen';
import { LanguageProvider } from './src/context/LanguageContext';

const MainNavigator: React.FC = () => {
    const { activeScreen } = useShop();

    const renderScreen = () => {
        switch (activeScreen) {
            case 'quick-payment':
                return <QuickPaymentScreen />;
            case 'video':
                return <VideoScreen />;
            case 'gate':
            default:
                return <GateScreen />;
        }
    };

    return <View style={styles.appWrapper}>{renderScreen()}</View>;
};

export default function App() {
    const [fontsLoaded, fontError] = useFonts({
        Montserrat_400Regular,
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
        Montserrat_800ExtraBold,
        Montserrat_900Black,
    });

    if (fontError) {
        throw fontError;
    }

    if (!fontsLoaded) {
        return null;
    }

    return (
        <LanguageProvider>
            <ShopProvider>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                    <MainNavigator />
                </SafeAreaView>
            </ShopProvider>
        </LanguageProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#07090f',
    },
    appWrapper: {
        flex: 1,
    },
});
