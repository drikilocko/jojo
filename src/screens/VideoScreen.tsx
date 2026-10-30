import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_KEY, EXPIRY_KEY } from "./GateScreen";

// 9 vidéos de démonstration (grille de 3, format portrait)
const VIDEOS = [
  { id: "1", title: "Session Exclusive #01", dur: "02:45", views: "3.8k", tag: "VIP" },
  { id: "2", title: "Contenu Privé #02", dur: "01:30", views: "2.1k", tag: "PREMIUM" },
  { id: "3", title: "Backstage Live #03", dur: "04:12", views: "5.4k", tag: "DIRECT" },
  { id: "4", title: "Masterclass Part 1", dur: "03:15", views: "1.9k", tag: "PRO" },
  { id: "5", title: "Session Studio #05", dur: "02:05", views: "4.2k", tag: "VIP" },
  { id: "6", title: "Archive Spéciale #06", dur: "05:40", views: "6.7k", tag: "EXCLUSIF" },
  { id: "7", title: "Secret Drop #07", dur: "01:50", views: "3.1k", tag: "VIP" },
  { id: "8", title: "Live Streaming #08", dur: "03:55", views: "2.8k", tag: "DIRECT" },
  { id: "9", title: "Séance Complète #09", dur: "06:20", views: "7.3k", tag: "ULTIME" },
];

interface Props {
  onLock: () => void;
  onRenew: () => void;
}

export const VideoScreen: React.FC<Props> = ({ onLock, onRenew }) => {
  const { width } = useWindowDimensions();
  const [daysLeft, setDaysLeft] = useState<number>(30);
  const [expired, setExpired] = useState(false);
  const [selectedVid, setSelectedVid] = useState<string | null>(null);

  // Responsive colonnes
  const colCount = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const colWidth = `${100 / colCount}%` as any;

  useEffect(() => {
    AsyncStorage.getItem(EXPIRY_KEY).then(raw => {
      if (raw) {
        const now = Date.now();
        const diff = parseInt(raw, 10) - now;
        if (diff <= 0) {
          setExpired(true);
        } else {
          setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }
      }
    });
  }, []);

  if (expired) {
    return (
      <View style={s.root}>
        <View style={s.expiredCenter}>
          <View style={s.expiredCard}>
            <View style={s.expIcon}>
              <Feather name="alert-triangle" size={32} color="#f87171" />
            </View>
            <Text style={s.expTitle}>Abonnement Expiré</Text>
            <Text style={s.expSub}>
              Votre mois d'accès (50 $) est arrivé à échéance. Renouvelez votre abonnement pour continuer à regarder les vidéos.
            </Text>
            <TouchableOpacity style={s.rechargeBtn} onPress={onRenew} activeOpacity={0.85}>
              <LinearGradient colors={["#8b5cf6", "#6366f1"]} style={s.rechargeGrad}>
                <Text style={s.rechargeTxt}>Renouveler pour 50 $ / mois</Text>
                <Feather name="arrow-right" size={17} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLock} style={{ marginTop: 14 }}>
              <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "600" }}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Barre de navigation supérieure */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.dot} />
          <Text style={s.brand}>ESPACE VIDÉO EXCLUSIF</Text>
        </View>

        {/* Badge d'abonnement actif 50$/mois */}
        <View style={s.subBadge}>
          <Feather name="check-circle" size={13} color="#34d399" />
          <Text style={s.subBadgeTxt}>Abonnement 50 $ / mois</Text>
          <View style={s.subBadgeDiv} />
          <Text style={s.subDays}>{daysLeft}j restants</Text>
        </View>

        <TouchableOpacity onPress={onLock} style={s.logoutBtn} activeOpacity={0.7}>
          <Feather name="log-out" size={16} color="#94a3b8" />
          <Text style={s.logoutTxt}>Quitter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Bannière d'en-tête */}
        <LinearGradient
          colors={["rgba(139,92,246,0.18)", "rgba(15,23,42,0.6)"]}
          style={s.heroBanner}
        >
          <View style={s.heroTag}>
            <Feather name="play-circle" size={12} color="#a78bfa" />
            <Text style={s.heroTagTxt}>FLUX EXCLUSIF • 9 VIDÉOS EN PORTRAIT</Text>
          </View>
          <Text style={s.heroTitle}>Galerie Vidéo Privée</Text>
          <Text style={s.heroSub}>
            Accès déverrouillé avec votre pass mensuel. Profitez de l'intégralité du catalogue.
          </Text>
        </LinearGradient>

        {/* Grille Portrait de 3 */}
        <View style={s.grid}>
          {VIDEOS.map((v) => (
            <View key={v.id} style={[s.col, { width: colWidth }]}>
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.88}
                onPress={() => setSelectedVid(v.id === selectedVid ? null : v.id)}
              >
                {/* Cadre vidéo portrait (ratio 9:16) */}
                <View style={s.portraitBox}>
                  <LinearGradient
                    colors={["#1e1b4b", "#0f172a", "#020617"]}
                    style={s.portraitBg}
                  >
                    {/* Badge catégorie */}
                    <View style={s.catBadge}>
                      <Text style={s.catTxt}>{v.tag}</Text>
                    </View>

                    {/* Overlay Vidéo Indisponible comme demandé */}
                    <View style={s.unavailOverlay}>
                      <View style={s.unavailIconBox}>
                        <Feather name="video-off" size={28} color="#94a3b8" />
                      </View>
                      <Text style={s.unavailTitle}>Vidéo indisponible</Text>
                      <Text style={s.unavailSub}>Flux en cours de traitement</Text>
                    </View>

                    {/* Durée en bas à droite */}
                    <View style={s.durBadge}>
                      <Feather name="clock" size={10} color="#fff" />
                      <Text style={s.durTxt}>{v.dur}</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Info sous la vidéo */}
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle} numberOfLines={1}>{v.title}</Text>
                  <View style={s.cardMeta}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Feather name="eye" size={11} color="#64748b" />
                      <Text style={s.metaTxt}>{v.views} vues</Text>
                    </View>
                    <View style={s.hdBadge}>
                      <Text style={s.hdTxt}>HD</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>Espace Vidéo Privé • Tous droits réservés</Text>
        </View>

      </ScrollView>
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
    backgroundColor: "rgba(7,9,15,0.9)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981" },
  brand: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.8 },
  subBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  subBadgeTxt: { color: "#34d399", fontSize: 11, fontWeight: "700" },
  subBadgeDiv: { width: 1, height: 10, backgroundColor: "rgba(52,211,153,0.4)" },
  subDays: { color: "#a7f3d0", fontSize: 11, fontWeight: "800" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 5, padding: 6 },
  logoutTxt: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  scroll: { padding: 18, paddingBottom: 50, maxWidth: 1100, width: "100%", alignSelf: "center" },
  heroBanner: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    marginBottom: 24,
  },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(139,92,246,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroTagTxt: { color: "#c4b5fd", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSub: { color: "#94a3b8", fontSize: 13, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8 },
  col: { padding: 8 },
  card: {
    backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  portraitBox: {
    width: "100%",
    aspectRatio: 9 / 14,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  portraitBg: {
    flex: 1,
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  catBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139,92,246,0.35)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catTxt: { color: "#e9d5ff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  unavailOverlay: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  unavailIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  unavailTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: "700", marginBottom: 3 },
  unavailSub: { color: "#64748b", fontSize: 11, textAlign: "center" },
  durBadge: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cardInfo: { padding: 12 },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaTxt: { color: "#64748b", fontSize: 11 },
  hdBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hdTxt: { color: "#94a3b8", fontSize: 9, fontWeight: "800" },
  footer: { marginTop: 40, alignItems: "center" },
  footerTxt: { color: "#475569", fontSize: 12 },
  expiredCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  expiredCard: {
    backgroundColor: "#0f172a",
    borderRadius: 22,
    padding: 26,
    maxWidth: 420,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  expIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239,68,68,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  expTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  expSub: { color: "#94a3b8", fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  rechargeBtn: { width: "100%", borderRadius: 14, overflow: "hidden" },
  rechargeGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  rechargeTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
