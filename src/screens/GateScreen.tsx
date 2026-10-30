import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Dimensions, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACCESS_KEY = "@jojo/unlocked";
export const VALID_CODES_KEY = "@jojo/codes";
export const EXPIRY_KEY = "@jojo/expiry";
const DEFAULT_CODE = "JOJO2024";

const { height } = Dimensions.get("window");

interface Props {
  onUnlock: () => void;
  onBuy: () => void;
}

export const GateScreen: React.FC<Props> = ({ onUnlock, onBuy }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Veuillez entrer votre code d’accès.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const savedRaw = await AsyncStorage.getItem(VALID_CODES_KEY);
      const saved: string[] = savedRaw ? JSON.parse(savedRaw) : [];
      if ([DEFAULT_CODE, ...saved].includes(clean)) {
        await AsyncStorage.setItem(ACCESS_KEY, "true");
        onUnlock();
      } else {
        setError("Code incorrect ou expiré. Achetez un abonnement ci-dessous.");
      }
    } catch {
      setError("Erreur de vérification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=85" }}
        style={s.bg}
        resizeMode="cover"
      >
        <LinearGradient colors={["rgba(5,7,15,0.65)", "transparent"]} style={s.topGrad} />
        <LinearGradient
          colors={["transparent", "rgba(7,9,15,0.4)", "rgba(7,9,15,0.82)", "rgba(7,9,15,0.97)", "#07090f"]}
          locations={[0, 0.35, 0.6, 0.82, 1]}
          style={s.botGrad}
        />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

            <View style={s.badge}>
              <Feather name="shield" size={12} color="#a78bfa" />
              <Text style={s.badgeText}>ESPACE PRIVÉ • ACCÈS EXCLUSIF</Text>
            </View>

            <View style={{ flex: 1 }} />

            <View style={s.bottom}>
              <Text style={s.title}>Accès Privé</Text>
              <Text style={s.sub}>Entrez votre code d'accès pour déverrouiller le flux vidéo.</Text>

              <View style={s.card}>
                <View style={[s.inputRow, error ? s.inputErr : null]}>
                  <Feather name="lock" size={20} color="#a78bfa" style={{ marginRight: 10 }} />
                  <TextInput
                    style={s.input}
                    placeholder="Ex: JOJO2024"
                    placeholderTextColor="#64748b"
                    value={code}
                    onChangeText={t => { setCode(t); setError(null); }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleUnlock}
                  />
                  {code.length > 0 && (
                    <TouchableOpacity onPress={() => setCode("")}>
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                {error && (
                  <View style={s.errRow}>
                    <Feather name="alert-circle" size={13} color="#f87171" />
                    <Text style={s.errText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={s.btn}
                  onPress={handleUnlock}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={["#8b5cf6", "#6366f1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={s.btnText}>Valider mon code</Text>
                        <Feather name="arrow-right" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={s.divRow}>
                <View style={s.div} /><Text style={s.divTxt}>PAS ENCORE DE CODE ?</Text><View style={s.div} />
              </View>

              <TouchableOpacity style={s.buyBtn} onPress={onBuy} activeOpacity={0.85}>
                <View style={s.buyInner}>
                  <View style={s.buyIcon}>
                    <Feather name="zap" size={22} color="#a78bfa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.buyTitle}>Obtenir mon code d'accès</Text>
                      <View style={s.tagPrice}>
                        <Text style={s.tagPriceTxt}>50 $ / mois</Text>
                      </View>
                    </View>
                    <Text style={s.buySub}>Accès illimité 30 jours • TMoney, Flooz, Carte</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#64748b" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setCode(DEFAULT_CODE); setError(null); }}>
                <Text style={s.hint}>Code de test : {DEFAULT_CODE}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07090f" },
  bg: { flex: 1, width: "100%", height: "100%" },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 130 },
  botGrad: { position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.72 },
  scroll: {
    flexGrow: 1,
    padding: 22,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 36,
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: "rgba(15,23,42,0.72)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeText: { color: "#e2e8f0", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  bottom: { width: "100%", maxWidth: 480, alignSelf: "center" },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5, marginBottom: 8 },
  sub: { color: "#94a3b8", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  card: {
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,6,23,0.9)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    paddingHorizontal: 14,
    height: 54,
  },
  inputErr: { borderColor: "#f87171" },
  input: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 2 },
  errRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 2 },
  errText: { color: "#f87171", fontSize: 12, flex: 1 },
  btn: { marginTop: 14, borderRadius: 14, overflow: "hidden" },
  btnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  divRow: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  div: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  divTxt: { color: "#64748b", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  buyBtn: {
    backgroundColor: "rgba(30,41,59,0.75)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    borderRadius: 16,
    padding: 14,
  },
  buyInner: { flexDirection: "row", alignItems: "center" },
  buyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  buyTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  tagPrice: {
    backgroundColor: "rgba(139,92,246,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  tagPriceTxt: { color: "#c4b5fd", fontSize: 11, fontWeight: "800" },
  buySub: { color: "#94a3b8", fontSize: 11, marginTop: 3 },
  hint: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    textDecorationLine: "underline",
  },
});
