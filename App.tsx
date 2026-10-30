import React, { useState, useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GateScreen, ACCESS_KEY } from "./src/screens/GateScreen";
import { PaymentScreen } from "./src/screens/PaymentScreen";
import { VideoScreen } from "./src/screens/VideoScreen";

type Screen = "gate" | "payment" | "video";

export default function App() {
  const [screen, setScreen] = useState<Screen>("gate");

  useEffect(() => {
    AsyncStorage.getItem(ACCESS_KEY).then(v => {
      if (v === "true") setScreen("video");
    });
  }, []);

  const lock = async () => {
    await AsyncStorage.removeItem(ACCESS_KEY);
    setScreen("gate");
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.root}>
        {screen === "gate" && (
          <GateScreen onUnlock={() => setScreen("video")} onBuy={() => setScreen("payment")} />
        )}
        {screen === "payment" && (
          <PaymentScreen onBack={() => setScreen("gate")} onSuccess={() => setScreen("video")} />
        )}
        {screen === "video" && (
          <VideoScreen onLock={lock} onAddTime={() => setScreen("payment")} />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07090f" },
  root: { flex: 1 },
});
