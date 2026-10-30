import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initiatePayment, isValidTogoNumber } from "../lib/paydunya";
import { ACCESS_KEY, VALID_CODES_KEY, EXPIRY_KEY } from "./GateScreen";

// 1 min = 300 FCFA, 50 USD = 30 500 FCFA
const RATE_PER_MIN = 300;

interface Props { onBack: () => void; onSuccess: () => void; }

export const PaymentScreen: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [minutes, setMinutes] = useState(5);
  const price = Math.max(1, minutes) * RATE_PER_MIN;

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
      setError("Num\u00e9ro Togo invalide (8 chiffres requis, ex : 90 12 34 56).");
      return;
    }
    if (method === "card" && cardNum.replace(/\s/g, "").length < 16) {
      setError("Num\u00e9ro de carte invalide (16 chiffres requis).");
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

      // Sauvegarder le code et l expiry
      const raw = await AsyncStorage.getItem(VALID_CODES_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(newCode)) { list.push(newCode); }
      await AsyncStorage.setItem(VALID_CODES_KEY, JSON.stringify(list));

      const expTs = Date.now() + minutes * 60 * 1000;
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
    const expTs = Date.now() + minutes * 60 * 1000;
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
          <Feather name="lock" size={11} color="#10b981" />
          <Text style={s.secureTxt}>100% S\u00e9curis\u00e9</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Carte Tarif */}
        <LinearGradient colors={["rgba(139,92,246,0.15)","rgba(30,41,59,0.5)"]} style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryIcon}><Feather name="clock" size={22} color="#a78bfa" /></View>
            <View style={{flex:1}}>
              <Text style={s.summaryTitle}>Acc\u00e8s Vid\u00e9o Priv\u00e9</Text>
              <Text style={s.summarySubtitle}>Tarif\u00a0: 300\u00a0FCFA / minute</Text>
            </View>
            <View style={s.priceBox}>
              <Text style={s.priceAmt}>{price.toLocaleString("fr-FR")}</Text>
              <Text style={s.priceCur}>FCFA</Text>
            </View>
          </View>

          {/* Stepper minutes */}
          <View style={s.stepBox}>
            <Text style={s.stepLabel}>Dur\u00e9e d\u2019acc\u00e8s souhait\u00e9e\u00a0:</Text>
            <View style={s.stepRow}>
              <TouchableOpacity style={s.stepBtn} onPress={()=>setMinutes(m=>Math.max(1,m-1))}>
                <Feather name="minus" size={16} color="#fff" />
              </TouchableOpacity>
              <View style={s.minBox}>
                <Text style={s.minNum}>{minutes}</Text>
                <Text style={s.minUnit}>min</Text>
              </View>
              <TouchableOpacity style={s.stepBtn} onPress={()=>setMinutes(m=>m+1)}>
                <Feather name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={s.chips}>
              {[1,3,5,10,15,30].map(p=>(
                <TouchableOpacity key={p} style={[s.chip, minutes===p&&s.chipActive]} onPress={()=>setMinutes(p)}>
                  <Text style={[s.chipTxt, minutes===p&&s.chipTxtActive]}>{p}min \u2022 {(p*300).toLocaleString("fr-FR")}F</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.refRow}>
              <Feather name="info" size={12} color="#64748b" />
              <Text style={s.refTxt}>30\u202f500\u00a0FCFA\u00a0\u2248\u00a050\u00a0USD pour 101\u00a0min d\u2019acc\u00e8s</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Methodes */}
        <Text style={s.sectionTitle}>Mode de paiement</Text>
        <View style={s.methods}>
          {([
            { id:"tmoney", label:"TMoney", color:"#eab308", letter:"T" },
            { id:"flooz",  label:"Flooz",  color:"#3b82f6", letter:"F" },
            { id:"card",   label:"Carte",  color:"#475569", icon:"credit-card" },
          ] as const).map(m=>(
            <TouchableOpacity key={m.id} style={[s.methodCard, method===m.id&&s.methodActive]} onPress={()=>setMethod(m.id)} activeOpacity={0.8}>
              <View style={[s.methodLogo,{backgroundColor:m.color}]}>
                {"letter" in m
                  ? <Text style={s.methodLetter}>{m.letter}</Text>
                  : <Feather name={m.icon} size={15} color="#fff" />
                }
              </View>
              <Text style={[s.methodName, method===m.id&&s.methodNameActive]}>{m.label}</Text>
              {method===m.id && <View style={s.check}><Feather name="check" size={11} color="#fff" /></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulaire */}
        <View style={s.form}>
          {method !== "card" ? (
            <>
              <Text style={s.fieldLabel}>Num\u00e9ro {method==="tmoney"?"TMoney":"Flooz"}</Text>
              <View style={s.fieldRow}>
                <Text style={s.prefix}>+228</Text>
                <TextInput style={s.field} placeholder={method==="tmoney"?"90 XX XX XX":"99 XX XX XX"}
                  placeholderTextColor="#64748b" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={12} />
              </View>
              <Text style={s.fieldHint}>Vous recevrez une invite de confirmation sur votre t\u00e9l\u00e9phone.</Text>
            </>
          ) : (
            <>
              <Text style={s.fieldLabel}>Nom sur la carte</Text>
              <View style={s.fieldRow}><TextInput style={s.field} placeholder="Ex: Jean Dupont" placeholderTextColor="#64748b" value={""} onChangeText={()=>{}} /></View>
              <Text style={[s.fieldLabel,{marginTop:12}]}>Num\u00e9ro de carte</Text>
              <View style={s.fieldRow}><TextInput style={s.field} placeholder="4532 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 8910" placeholderTextColor="#64748b" keyboardType="number-pad" value={cardNum} onChangeText={setCardNum} maxLength={19} /></View>
              <View style={{flexDirection:"row",gap:12}}>
                <View style={{flex:1}}>
                  <Text style={[s.fieldLabel,{marginTop:12}]}>Date exp.</Text>
                  <View style={s.fieldRow}><TextInput style={s.field} placeholder="MM/AA" placeholderTextColor="#64748b" value={expiry} onChangeText={setExpiry} maxLength={5} /></View>
                </View>
                <View style={{flex:1}}>
                  <Text style={[s.fieldLabel,{marginTop:12}]}>CVC</Text>
                  <View style={s.fieldRow}><TextInput style={s.field} placeholder="123" placeholderTextColor="#64748b" keyboardType="number-pad" secureTextEntry value={cvc} onChangeText={setCvc} maxLength={4} /></View>
                </View>
              </View>
            </>
          )}

          {error && (
            <View style={s.errBox}>
              <Feather name="alert-circle" size={15} color="#f87171" />
              <Text style={s.errTxt}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={s.payBtn} onPress={pay} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={["#8b5cf6","#6366f1"]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.payGrad}>
              {loading
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={s.payTxt}>Traitement...</Text></>
                : <><Text style={s.payTxt}>Payer {price.toLocaleString("fr-FR")}\u00a0FCFA</Text><Feather name="check-circle" size={18} color="#fff" /></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal success */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalIcon}><Feather name="check" size={30} color="#10b981" /></View>
            <Text style={s.modalTitle}>Paiement confirm\u00e9 !</Text>
            <Text style={s.modalSub}>Votre code d\u2019acc\u00e8s personnel\u00a0:</Text>
            <View style={s.codeBox}><Text style={s.codeText}>{code}</Text></View>
            <TouchableOpacity style={s.accessBtn} onPress={handleAccess} activeOpacity={0.85}>
              <LinearGradient colors={["#10b981","#059669"]} style={s.accessGrad}>
                <Text style={s.accessTxt}>Acc\u00e9der aux vid\u00e9os</Text>
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
  root:{flex:1,backgroundColor:"#07090f"},
  header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:20,paddingTop:Platform.OS==="ios"?52:36,paddingBottom:14,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,0.08)"},
  back:{flexDirection:"row",alignItems:"center",gap:8},
  backTxt:{color:"#fff",fontSize:14,fontWeight:"600"},
  secureBadge:{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:"rgba(16,185,129,0.1)",paddingHorizontal:10,paddingVertical:5,borderRadius:12,borderWidth:1,borderColor:"rgba(16,185,129,0.3)"},
  secureTxt:{color:"#10b981",fontSize:11,fontWeight:"700"},
  scroll:{padding:20,paddingBottom:60,maxWidth:520,width:"100%",alignSelf:"center"},
  summaryCard:{borderRadius:18,padding:18,borderWidth:1,borderColor:"rgba(167,139,250,0.3)",marginBottom:24},
  summaryRow:{flexDirection:"row",alignItems:"center",gap:12},
  summaryIcon:{width:44,height:44,borderRadius:12,backgroundColor:"rgba(139,92,246,0.18)",alignItems:"center",justifyContent:"center"},
  summaryTitle:{color:"#fff",fontSize:16,fontWeight:"700"},
  summarySubtitle:{color:"#94a3b8",fontSize:11,marginTop:2},
  priceBox:{alignItems:"flex-end"},
  priceAmt:{color:"#fff",fontSize:20,fontWeight:"900"},
  priceCur:{color:"#a78bfa",fontSize:11,fontWeight:"700"},
  stepBox:{marginTop:16,paddingTop:14,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.1)"},
  stepLabel:{color:"#cbd5e1",fontSize:12,fontWeight:"600",marginBottom:10},
  stepRow:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:14,marginBottom:12},
  stepBtn:{width:36,height:36,borderRadius:18,backgroundColor:"rgba(139,92,246,0.22)",borderWidth:1,borderColor:"rgba(167,139,250,0.4)",alignItems:"center",justifyContent:"center"},
  minBox:{flexDirection:"row",alignItems:"baseline",gap:4,backgroundColor:"rgba(2,6,23,0.85)",paddingHorizontal:20,paddingVertical:8,borderRadius:12,borderWidth:1,borderColor:"rgba(139,92,246,0.4)"},
  minNum:{color:"#fff",fontSize:22,fontWeight:"900"},
  minUnit:{color:"#a78bfa",fontSize:13,fontWeight:"700"},
  chips:{flexDirection:"row",flexWrap:"wrap",gap:7,justifyContent:"center",marginBottom:12},
  chip:{backgroundColor:"rgba(15,23,42,0.85)",borderWidth:1,borderColor:"rgba(255,255,255,0.1)",paddingHorizontal:9,paddingVertical:5,borderRadius:10},
  chipActive:{borderColor:"#8b5cf6",backgroundColor:"rgba(139,92,246,0.22)"},
  chipTxt:{color:"#94a3b8",fontSize:11,fontWeight:"600"},
  chipTxtActive:{color:"#fff",fontWeight:"700"},
  refRow:{flexDirection:"row",alignItems:"center",gap:6},
  refTxt:{color:"#64748b",fontSize:11,flex:1},
  sectionTitle:{color:"#e2e8f0",fontSize:15,fontWeight:"700",marginBottom:12},
  methods:{flexDirection:"row",gap:10,marginBottom:20},
  methodCard:{flex:1,backgroundColor:"rgba(30,41,59,0.5)",borderWidth:1,borderColor:"rgba(255,255,255,0.1)",borderRadius:14,padding:12,alignItems:"center",position:"relative"},
  methodActive:{borderColor:"#8b5cf6",backgroundColor:"rgba(139,92,246,0.15)"},
  methodLogo:{width:32,height:32,borderRadius:8,alignItems:"center",justifyContent:"center",marginBottom:7},
  methodLetter:{color:"#fff",fontWeight:"900",fontSize:14},
  methodName:{color:"#94a3b8",fontSize:12,fontWeight:"600"},
  methodNameActive:{color:"#fff",fontWeight:"700"},
  check:{position:"absolute",top:6,right:6,width:17,height:17,borderRadius:9,backgroundColor:"#8b5cf6",alignItems:"center",justifyContent:"center"},
  form:{backgroundColor:"rgba(15,23,42,0.72)",borderWidth:1,borderColor:"rgba(255,255,255,0.1)",borderRadius:18,padding:18},
  fieldLabel:{color:"#cbd5e1",fontSize:13,fontWeight:"600",marginBottom:8},
  fieldRow:{flexDirection:"row",alignItems:"center",backgroundColor:"rgba(2,6,23,0.85)",borderWidth:1,borderColor:"rgba(148,163,184,0.22)",borderRadius:12,paddingHorizontal:14,height:50},
  prefix:{color:"#a78bfa",fontWeight:"700",marginRight:8},
  field:{flex:1,color:"#fff",fontSize:15,fontWeight:"500"},
  fieldHint:{color:"#64748b",fontSize:11,marginTop:7,lineHeight:15},
  errBox:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"rgba(239,68,68,0.08)",borderWidth:1,borderColor:"rgba(239,68,68,0.28)",borderRadius:10,padding:12,marginTop:14},
  errTxt:{color:"#f87171",fontSize:12,flex:1},
  payBtn:{marginTop:20,borderRadius:14,overflow:"hidden"},
  payGrad:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,paddingVertical:15},
  payTxt:{color:"#fff",fontSize:15,fontWeight:"700"},
  overlay:{flex:1,backgroundColor:"rgba(0,0,0,0.85)",alignItems:"center",justifyContent:"center",padding:20},
  modal:{width:"100%",maxWidth:400,backgroundColor:"#0f172a",borderWidth:1,borderColor:"rgba(167,139,250,0.3)",borderRadius:22,padding:24,alignItems:"center"},
  modalIcon:{width:60,height:60,borderRadius:30,backgroundColor:"rgba(16,185,129,0.15)",borderWidth:2,borderColor:"#10b981",alignItems:"center",justifyContent:"center",marginBottom:14},
  modalTitle:{color:"#fff",fontSize:20,fontWeight:"800",marginBottom:6},
  modalSub:{color:"#94a3b8",fontSize:13,textAlign:"center",marginBottom:16},
  codeBox:{backgroundColor:"rgba(139,92,246,0.14)",borderWidth:2,borderStyle:"dashed",borderColor:"#8b5cf6",borderRadius:14,paddingVertical:12,paddingHorizontal:26,marginBottom:20},
  codeText:{color:"#a78bfa",fontSize:26,fontWeight:"900",letterSpacing:4},
  accessBtn:{width:"100%",borderRadius:14,overflow:"hidden"},
  accessGrad:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,paddingVertical:15},
  accessTxt:{color:"#fff",fontSize:15,fontWeight:"700"},
});
