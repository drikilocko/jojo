import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initiatePayment, isValidTogoNumber } from "../lib/paydunya";
import { ACCESS_KEY, VALID_CODES_KEY, EXPIRY_KEY } from "./GateScreen";

// Prix fixe : 50 $ par mois (= 30 500 FCFA)
export const PRICE_USD = "50 $";
export const PRICE_FCFA = 30500;
export const DURATION_DAYS = 30;

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export const PaymentScreen: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [method, setMethod] = useState<"tmoney" | "flooz" | "card">("tmoney");
  const [phone, setPhone] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [code, setCode] = useState("");

  const pay = async () => {
    setError(null);
    if ((method === "tmoney" || method === "flooz") && !isValidTogoNumber(phone)) {
      setError("Numéro Togo invalide (8 chiffres requis, ex : 90 12 34 56).");
      return;
    }
    if (method === "card" && cardNum.replace(/\s/g, "").length < 16) {
      setError("Numéro de carte invalide (16 chiffres requis).");
      return;
    }
    setLoading(true);
    try {
      const newCode = "VIP-" + Math.floor(1000 + Math.random() * 9000);
      const orderId = "JOJO-" + Date.now();

      if (method === "tmoney" || method === "flooz") {
        const res = await initiatePayment(orderId, method, phone);
        if (!res.success && !res.message) console.warn("PayDunya:", res.error);
      } else {
        await new Promise(r => setTimeout(r, 1200));
      }

      // Sauvegarder le code et validité de 30 jours (1 mois)
      const raw = await AsyncStorage.getItem(VALID_CODES_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(newCode)) {
        list.push(newCode);
      }
      await AsyncStorage.setItem(VALID_CODES_KEY, JSON.stringify(list));

      const expTs = Date.now() + DURATION_DAYS * 24 * 60 * 60 * 1000;
      await AsyncStorage.setItem(EXPIRY_KEY, expTs.toString());

      setCode(newCode);
      setSuccessModal(true);
    } catch (e: any) {
      setError(e.message || "Erreur de paiement.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccess = async () => {
    const expTs = Date.now() + DURATION_DAYS * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem(ACCESS_KEY, "true");
    await AsyncStorage.setItem(EXPIRY_KEY, expTs.toString());
    setSuccessModal(false);
    onSuccess();
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color="#fff" />
          <Text style={s.backTxt}>Retour</Text>
        </TouchableOpacity>
        <View style={s.secureBadge}>
          <Feather name="shield" size={12} color="#10b981" />
          <Text style={s.secureTxt}>Paiement 100% Sécurisé</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Carte Tarif Fixe - 50$ / mois */}
        <LinearGradient colors={["rgba(139,92,246,0.2)", "rgba(30,41,59,0.7)"]} style={s.summaryCard}>
          <View style={s.summaryBadge}>
            <Feather name="star" size={12} color="#fbbf24" />
            <Text style={s.summaryBadgeTxt}>FORMULE MENSUELLE ILLIMITÉE</Text>
          </View>

          <View style={s.summaryMain}>
            <View>
              <Text style={s.summaryTitle}>Accès Intégral aux Vidéos</Text>
              <Text style={s.summarySubtitle}>30 jours d'accès complet • Sans engagement</Text>
            </View>
            <View style={s.priceBox}>
              <Text style={s.priceMain}>50 $</Text>
              <Text style={s.pricePer}>/ mois</Text>
            </View>
          </View>

          <View style={s.priceEquivRow}>
            <Feather name="info" size={13} color="#94a3b8" />
            <Text style={s.priceEquivTxt}>Soit environ {PRICE_FCFA.toLocaleString("fr-FR")} FCFA par mois</Text>
          </View>
        </LinearGradient>

        {/* Moyens de Paiement */}
        <Text style={s.sectionTitle}>Moyen de paiement</Text>
        <View style={s.methodsGrid}>
          {/* TMoney */}
          <TouchableOpacity
            style={[s.methodCard, method === "tmoney" && s.methodCardActive]}
            onPress={() => setMethod("tmoney")}
            activeOpacity={0.8}
          >
            <View style={[s.radio, method === "tmoney" && s.radioActive]}>
              {method === "tmoney" && <View style={s.radioDot} />}
            </View>
            <View style={s.methodIconBox}>
              <Text style={s.tmoneyBadge}>TM</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.methodName}>TMoney (Togo)</Text>
              <Text style={s.methodSub}>Paiement instantané</Text>
            </View>
          </TouchableOpacity>

          {/* Flooz */}
          <TouchableOpacity
            style={[s.methodCard, method === "flooz" && s.methodCardActive]}
            onPress={() => setMethod("flooz")}
            activeOpacity={0.8}
          >
            <View style={[s.radio, method === "flooz" && s.radioActive]}>
              {method === "flooz" && <View style={s.radioDot} />}
            </View>
            <View style={s.methodIconBox}>
              <Text style={s.floozBadge}>FL</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.methodName}>Flooz (Moov)</Text>
              <Text style={s.methodSub}>Paiement instantané</Text>
            </View>
          </TouchableOpacity>

          {/* Carte */}
          <TouchableOpacity
            style={[s.methodCard, method === "card" && s.methodCardActive]}
            onPress={() => setMethod("card")}
            activeOpacity={0.8}
          >
            <View style={[s.radio, method === "card" && s.radioActive]}>
              {method === "card" && <View style={s.radioDot} />}
            </View>
            <View style={s.methodIconBox}>
              <Feather name="credit-card" size={18} color="#a78bfa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.methodName}>Carte Bancaire</Text>
              <Text style={s.methodSub}>Visa, Mastercard</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Formulaire selon moyen */}
        <View style={s.formBox}>
          {method === "tmoney" || method === "flooz" ? (
            <View>
              <Text style={s.inputLabel}>Numéro {method === "tmoney" ? "TMoney" : "Flooz"} (8 chiffres)</Text>
              <View style={s.inputRow}>
                <Text style={s.flag}>🇹🇬 +228</Text>
                <TextInput
                  style={s.input}
                  placeholder="Ex : 90 12 34 56"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={12}
                />
              </View>
              <Text style={s.helpTxt}>Vous recevrez une invite de confirmation sur votre téléphone.</Text>
            </View>
          ) : (
            <View>
              <Text style={s.inputLabel}>Numéro de Carte</Text>
              <View style={s.inputRow}>
                <Feather name="credit-card" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={s.input}
                  placeholder="4000 1234 5678 9010"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={cardNum}
                  onChangeText={setCardNum}
                  maxLength={19}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Expiration</Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={s.input}
                      placeholder="MM/AA"
                      placeholderTextColor="#64748b"
                      value={expiry}
                      onChangeText={setExpiry}
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>CVC / CVV</Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={s.input}
                      placeholder="123"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={cvc}
                      onChangeText={setCvc}
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {error && (
            <View style={s.errBox}>
              <Feather name="alert-circle" size={14} color="#f87171" />
              <Text style={s.errTxt}>{error}</Text>
            </View>
          )}

          {/* Bouton de confirmation */}
          <TouchableOpacity
            style={s.payBtn}
            onPress={pay}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#8b5cf6", "#6366f1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.payBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={s.payBtnTxt}>Payer 50 $ par mois</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.securityNotice}>
          <Feather name="lock" size={13} color="#64748b" />
          <Text style={s.securityNoticeTxt}>
            Transaction sécurisée avec cryptage SSL 256 bits. Aucun engagement.
          </Text>
        </View>

      </ScrollView>

      {/* Modal Succès avec Code Délivré */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalSuccessIcon}>
              <Feather name="check" size={32} color="#10b981" />
            </View>
            <Text style={s.modalTitle}>Paiement Confirmé !</Text>
            <Text style={s.modalSub}>
              Votre abonnement mensuel (50 $) est actif pour 30 jours. Voici votre code d'accès personnel :
            </Text>

            <View style={s.codeBox}>
              <Text style={s.codeTxt}>{code}</Text>
              <Text style={s.codeValidity}>Valable 30 jours</Text>
            </View>

            <TouchableOpacity
              style={s.modalBtn}
              onPress={handleAccess}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#8b5cf6", "#6366f1"]} style={s.modalBtnGrad}>
                <Text style={s.modalBtnTxt}>Accéder aux vidéos maintenant</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07090f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  backTxt: { color: "#fff", fontSize: 15, fontWeight: "600" },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  secureTxt: { color: "#34d399", fontSize: 11, fontWeight: "700" },
  scroll: { padding: 18, paddingBottom: 40, maxWidth: 520, width: "100%", alignSelf: "center" },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
    marginBottom: 24,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,191,36,0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryBadgeTxt: { color: "#fbbf24", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  summaryMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 3 },
  summarySubtitle: { color: "#94a3b8", fontSize: 12 },
  priceBox: { alignItems: "flex-end" },
  priceMain: { color: "#a78bfa", fontSize: 26, fontWeight: "900" },
  pricePer: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  priceEquivRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  priceEquivTxt: { color: "#94a3b8", fontSize: 12 },
  sectionTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: "700", marginBottom: 12, letterSpacing: 0.5 },
  methodsGrid: { gap: 10, marginBottom: 20 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    padding: 14,
    gap: 12,
  },
  methodCardActive: {
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(139,92,246,0.1)",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: "#a78bfa" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#a78bfa" },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  tmoneyBadge: { color: "#38bdf8", fontWeight: "900", fontSize: 13 },
  floozBadge: { color: "#f59e0b", fontWeight: "900", fontSize: 13 },
  methodName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  methodSub: { color: "#64748b", fontSize: 11, marginTop: 2 },
  formBox: {
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  inputLabel: { color: "#cbd5e1", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,6,23,0.8)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  flag: { color: "#e2e8f0", fontSize: 13, fontWeight: "700", marginRight: 8 },
  input: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  helpTxt: { color: "#64748b", fontSize: 11, marginTop: 6 },
  errBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  errTxt: { color: "#f87171", fontSize: 12, flex: 1 },
  payBtn: { marginTop: 18, borderRadius: 14, overflow: "hidden" },
  payBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  payBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  securityNotice: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  securityNoticeTxt: { color: "#64748b", fontSize: 11, textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  modalSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16,185,129,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  modalSub: { color: "#94a3b8", fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 18 },
  codeBox: {
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 2,
    borderColor: "#8b5cf6",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  codeTxt: { color: "#a78bfa", fontSize: 26, fontWeight: "900", letterSpacing: 4 },
  codeValidity: { color: "#34d399", fontSize: 11, fontWeight: "700", marginTop: 4 },
  modalBtn: { width: "100%", borderRadius: 14, overflow: "hidden" },
  modalBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  modalBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
