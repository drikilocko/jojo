import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_KEY, EXPIRY_KEY } from "./GateScreen";

const VIDEOS = [
  {id:"1",title:"Session Exclusive #01",dur:"02:45",views:"3.8k",cat:"VIP"},
  {id:"2",title:"Contenu Priv\u00e9 #02",dur:"01:30",views:"2.1k",cat:"PREMIUM"},
  {id:"3",title:"Backstage Live #03",dur:"04:12",views:"5.4k",cat:"DIRECT"},
  {id:"4",title:"Masterclass Part 1",dur:"03:15",views:"1.9k",cat:"PRO"},
  {id:"5",title:"Session Studio #05",dur:"02:05",views:"4.2k",cat:"VIP"},
  {id:"6",title:"Archive Sp\u00e9ciale #06",dur:"05:40",views:"6.7k",cat:"EXCLUSIF"},
  {id:"7",title:"Secret Drop #07",dur:"01:50",views:"3.1k",cat:"VIP"},
  {id:"8",title:"Live Streaming #08",dur:"03:55",views:"2.8k",cat:"DIRECT"},
  {id:"9",title:"S\u00e9ance Compl\u00e8te #09",dur:"06:20",views:"7.3k",cat:"ULTIME"},
];

interface Props { onLock: () => void; onAddTime: () => void; }

export const VideoScreen: React.FC<Props> = ({ onLock, onAddTime }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let timer: any;
    AsyncStorage.getItem(EXPIRY_KEY).then(raw => {
      const now = Date.now();
      if (raw) {
        const remaining = Math.max(0, Math.floor((parseInt(raw,10) - now) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) { setExpired(true); return; }
      }
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timer); setExpired(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    });
    return () => { if(timer) clearInterval(timer); };
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  if (expired) return (
    <View style={s.root}>
      <View style={s.expiredCenter}>
        <View style={s.expiredCard}>
          <View style={s.expIcon}><Feather name="clock" size={28} color="#f87171" /></View>
          <Text style={s.expTitle}>Session termin\u00e9e !</Text>
          <Text style={s.expSub}>Votre temps d\u2019acc\u00e8s est \u00e9coul\u00e9. Rechargez du temps (300\u00a0FCFA/min) pour continuer.</Text>
          <TouchableOpacity style={s.rechargeBtn} onPress={onAddTime} activeOpacity={0.85}>
            <LinearGradient colors={["#8b5cf6","#6366f1"]} style={s.rechargeGrad}>
              <Text style={s.rechargeTxt}>Recharger du temps</Text>
              <Feather name="arrow-right" size={17} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLock} style={{marginTop:12}}>
            <Text style={{color:"#64748b",fontSize:13,fontWeight:"600"}}>Quitter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.dot} />
          <Text style={s.brand}>ZONE VID\u00c9O PRIV\u00c9E</Text>
        </View>
        <View style={s.timerBadge}>
          <Feather name="clock" size={13} color="#34d399" />
          <Text style={s.timerLabel}>Restant\u00a0:</Text>
          <Text style={s.timerVal}>{fmt(timeLeft)}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.addBtn} onPress={onAddTime} activeOpacity={0.8}>
            <Feather name="plus-circle" size={14} color="#a78bfa" />
            {!isMobile && <Text style={s.addTxt}>Ajouter</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onLock} style={{padding:6}}>
            <Feather name="log-out" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topSection}>
          <View style={s.tag}>
            <Feather name="lock" size={11} color="#a78bfa" />
            <Text style={s.tagTxt}>FLUX CHIFFR\u00c9</Text>
          </View>
          <Text style={s.title}>Vid\u00e9os Exclusives</Text>
          <Text style={s.sub}>Grille portrait 9:16. Mise \u00e0 jour des serveurs en cours.</Text>
        </View>

        {/* Grille 3 colonnes portrait */}
        <View style={s.grid}>
          {VIDEOS.map(v => (
            <View key={v.id} style={[s.card,{width:"31.5%"}]}>
              <View style={s.portrait}>
                <LinearGradient colors={["#1e293b","#0f172a","#020617"]} style={s.gradBg}>
                  <View style={s.cardTop}>
                    <View style={s.catBadge}><Text style={s.catTxt}>{v.cat}</Text></View>
                    <View style={s.durPill}><Text style={s.durTxt}>{v.dur}</Text></View>
                  </View>
                  <View style={s.unavail}>
                    <View style={s.iconCircle}><Feather name="video-off" size={22} color="#f87171" /></View>
                    <Text style={s.unavailTxt}>Vid\u00e9o indisponible</Text>
                    <Text style={s.unavailSub}>En maintenance</Text>
                  </View>
                  <View style={s.cardBot}>
                    <Text style={s.vTitle} numberOfLines={1}>{v.title}</Text>
                    <View style={{flexDirection:"row",alignItems:"center",gap:4}}>
                      <Feather name="eye" size={10} color="#64748b" />
                      <Text style={s.views}>{v.views}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ))}
        </View>

        <View style={s.notice}>
          <Feather name="info" size={18} color="#a78bfa" />
          <Text style={s.noticeTxt}>Tarif en vigueur\u00a0: <Text style={{fontWeight:"800",color:"#fff"}}>300\u00a0FCFA / minute</Text>. Votre temps est d\u00e9compt\u00e9 en direct. 30\u202f500\u00a0FCFA\u00a0\u2248\u00a050\u00a0USD.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#07090f"},
  header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingTop:Platform.OS==="ios"?52:36,paddingBottom:14,backgroundColor:"rgba(15,23,42,0.88)",borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,0.08)"},
  headerLeft:{flexDirection:"row",alignItems:"center",gap:8},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:"#10b981"},
  brand:{color:"#fff",fontSize:13,fontWeight:"800",letterSpacing:0.4},
  timerBadge:{flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"rgba(16,185,129,0.12)",paddingHorizontal:12,paddingVertical:6,borderRadius:16,borderWidth:1,borderColor:"rgba(16,185,129,0.32)"},
  timerLabel:{color:"#94a3b8",fontSize:11,fontWeight:"600"},
  timerVal:{color:"#34d399",fontSize:14,fontWeight:"900",letterSpacing:1},
  headerRight:{flexDirection:"row",alignItems:"center",gap:10},
  addBtn:{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:"rgba(139,92,246,0.14)",borderWidth:1,borderColor:"rgba(167,139,250,0.28)",paddingHorizontal:10,paddingVertical:6,borderRadius:12},
  addTxt:{color:"#a78bfa",fontSize:12,fontWeight:"700"},
  scroll:{padding:16,paddingBottom:60,maxWidth:1100,width:"100%",alignSelf:"center"},
  topSection:{marginVertical:16},
  tag:{flexDirection:"row",alignItems:"center",gap:5,alignSelf:"flex-start",backgroundColor:"rgba(139,92,246,0.13)",paddingHorizontal:9,paddingVertical:4,borderRadius:11,marginBottom:7},
  tagTxt:{color:"#a78bfa",fontSize:10,fontWeight:"800",letterSpacing:1},
  title:{color:"#fff",fontSize:24,fontWeight:"900",letterSpacing:-0.4},
  sub:{color:"#94a3b8",fontSize:13,marginTop:3},
  grid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",rowGap:14,marginTop:8},
  card:{borderRadius:14,overflow:"hidden",borderWidth:1,borderColor:"rgba(255,255,255,0.07)",backgroundColor:"#0f172a"},
  portrait:{aspectRatio:9/16,width:"100%"},
  gradBg:{flex:1,justifyContent:"space-between",padding:9},
  cardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  catBadge:{backgroundColor:"rgba(2,6,23,0.75)",paddingHorizontal:7,paddingVertical:3,borderRadius:7},
  catTxt:{color:"#a78bfa",fontSize:9,fontWeight:"800"},
  durPill:{backgroundColor:"rgba(0,0,0,0.6)",paddingHorizontal:6,paddingVertical:2,borderRadius:5},
  durTxt:{color:"#fff",fontSize:9,fontWeight:"600"},
  unavail:{alignItems:"center",justifyContent:"center",paddingHorizontal:6},
  iconCircle:{width:44,height:44,borderRadius:22,backgroundColor:"rgba(239,68,68,0.1)",borderWidth:1,borderColor:"rgba(239,68,68,0.28)",alignItems:"center",justifyContent:"center",marginBottom:7},
  unavailTxt:{color:"#f87171",fontSize:12,fontWeight:"800",textAlign:"center"},
  unavailSub:{color:"#64748b",fontSize:10,marginTop:2},
  cardBot:{backgroundColor:"rgba(2,6,23,0.6)",padding:7,borderRadius:8},
  vTitle:{color:"#fff",fontSize:10,fontWeight:"700",marginBottom:3},
  views:{color:"#64748b",fontSize:10,fontWeight:"600"},
  notice:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"rgba(30,41,59,0.45)",borderWidth:1,borderColor:"rgba(167,139,250,0.22)",borderRadius:14,padding:14,marginTop:22},
  noticeTxt:{color:"#cbd5e1",fontSize:13,flex:1},
  expiredCenter:{flex:1,alignItems:"center",justifyContent:"center",padding:20},
  expiredCard:{width:"100%",maxWidth:400,backgroundColor:"#0f172a",borderWidth:1,borderColor:"rgba(239,68,68,0.28)",borderRadius:22,padding:26,alignItems:"center"},
  expIcon:{width:58,height:58,borderRadius:29,backgroundColor:"rgba(239,68,68,0.12)",alignItems:"center",justifyContent:"center",marginBottom:14},
  expTitle:{color:"#fff",fontSize:20,fontWeight:"800",marginBottom:7},
  expSub:{color:"#94a3b8",fontSize:13,textAlign:"center",lineHeight:18,marginBottom:22},
  rechargeBtn:{width:"100%",borderRadius:14,overflow:"hidden"},
  rechargeGrad:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,paddingVertical:14},
  rechargeTxt:{color:"#fff",fontSize:15,fontWeight:"700"},
});
