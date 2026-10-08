import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView } from "react-native";

const METERS = {
  "1-001234": { street: "Broadway & W 72nd St", borough: "Manhattan", type: "Muni Meter", rate: "$4.00/hr", safe: true, safeUntil: "6:00 PM", cleaning: "Thu 8:00-9:30 AM" },
  "1-009871": { street: "W 72nd St & Amsterdam Ave", borough: "Manhattan", type: "Muni Meter", rate: "$3.00/hr", safe: false, restriction: "Street Cleaning 8-9:30 AM", risk: "CRITICAL - Trucks Active", cost: "$300-$500+" },
  "2-004521": { street: "Flatbush Ave & Atlantic Ave", borough: "Brooklyn", type: "Single Space", rate: "$2.50/hr", safe: true, safeUntil: "7:00 PM", cleaning: "Mon/Thu 11:30 AM-1 PM" },
  "2-008833": { street: "Bedford Ave & N 7th St", borough: "Brooklyn", type: "Muni Meter", rate: "$3.50/hr", safe: false, restriction: "No Standing 7-10 AM", risk: "HIGH - Active Zone", cost: "$115-$300+" },
  "3-002201": { street: "Queens Blvd & 74th St", borough: "Queens", type: "Muni Meter", rate: "$3.00/hr", safe: true, safeUntil: "8:00 PM", cleaning: "Tue/Fri 9-10:30 AM" },
  "3-007744": { street: "Jamaica Ave & 168th St", borough: "Queens", type: "Single Space", rate: "$1.50/hr", safe: false, restriction: "Tow Away Zone 7AM-7PM", risk: "CRITICAL - Active Tow Zone", cost: "$300-$500+" },
};

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState("");

  const checkMeter = (id) => {
    const val = (id || input).trim().toLowerCase();
    if (!val) return;
    setLoading(true);
    setError("");
    setResult(null);
    setTimeout(() => {
      const data = METERS[val];
      if (data) {
        setResult(data);
        setChecked((id || input).trim().toUpperCase());
      } else {
        setError("Meter not found. Try: 1-001234 or 1-009871");
      }
      setLoading(false);
    }, 1000);
  };

  const reset = () => {
    setResult(null);
    setInput("");
    setError("");
    setChecked("");
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.logo}>TOW<Text style={s.red}>ED</Text></Text>
          <Text style={s.tagline}>NYC Parking Survival</Text>
        </View>

        {!result ? (
          <View>
            <View style={s.alertBar}>
              <Text style={s.alertTitle}>ACTIVE ALERT - YOUR AREA</Text>
              <Text style={s.alertSub}>Street cleaning on W 72nd St - RIGHT NOW</Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>METER LOOKUP</Text>
              <TextInput
                style={s.input}
                placeholder="Enter meter number e.g. 1-001234"
                placeholderTextColor="#666680"
                value={input}
                onChangeText={setInput}
                autoCapitalize="none"
                onSubmitEditing={() => checkMeter()}
              />
              <TouchableOpacity style={s.btn} onPress={() => checkMeter()}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>CHECK THIS METER</Text>}
              </TouchableOpacity>
              {error ? <Text style={s.error}>{error}</Text> : null}
            </View>

            <Text style={s.sampleLabel}>TRY A SAMPLE METER</Text>
            {Object.keys(METERS).map(id => (
              <TouchableOpacity key={id} style={s.sampleBtn} onPress={() => { setInput(id); checkMeter(id); }}>
                <Text style={s.sampleId}>{id}</Text>
                <Text style={s.sampleStatus}>{METERS[id].safe ? "Safe" : "Danger"} - {METERS[id].borough}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <View style={[s.hero, result.safe ? s.heroSafe : s.heroDanger]}>
              <Text style={s.heroEmoji}>{result.safe ? "✅" : "🚨"}</Text>
              <Text style={[s.verdict, result.safe ? s.green : s.red]}>{result.safe ? "SAFE TO PARK" : "DO NOT PARK"}</Text>
              <Text style={s.verdictSub}>{result.safe ? "No restrictions active right now" : "Active tow zone - move immediately"}</Text>
              <Text style={s.meterId}>METER #{checked}</Text>
            </View>

            {[
              { icon: "📍", label: "Location", value: result.street },
              { icon: "🏙", label: "Borough", value: result.borough },
              { icon: "🅿️", label: "Type", value: result.type },
              { icon: "💵", label: "Rate", value: result.rate },
              ...(result.safe
                ? [{ icon: "🕐", label: "Safe Until", value: result.safeUntil, color: "#00E676" },
                   { icon: "🧹", label: "Next Cleaning", value: result.cleaning, color: "#FFD60A" }]
                : [{ icon: "⚠️", label: "Restriction", value: result.restriction, color: "#FF2D55" },
                   { icon: "🚛", label: "Tow Risk", value: result.risk, color: "#FF2D55" },
                   { icon: "💸", label: "Est. Cost", value: result.cost, color: "#FF2D55" }])
            ].map((row, i) => (
              <View key={i} style={[s.row, result.safe ? s.rowSafe : s.rowDanger]}>
                <Text style={s.rowIcon}>{row.icon}</Text>
                <View>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={[s.rowValue, row.color ? { color: row.color } : {}]}>{row.value}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={[s.btn, result.safe ? s.btnSafe : s.btnDanger]} onPress={reset}>
              <Text style={[s.btnText, result.safe && { color: "#001A0A" }]}>
                {result.safe ? "Set Move Reminder" : "Find Safe Parking Nearby"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.back} onPress={reset}>
              <Text style={s.backText}>Check Another Meter</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070710" },
  scroll: { padding: 20, paddingBottom: 60 },
  header: { alignItems: "center", paddingVertical: 30 },
  logo: { fontSize: 48, fontWeight: "900", color: "#F0F0FF", letterSpacing: 6 },
  red: { color: "#FF2D55" },
  green: { color: "#00E676" },
  tagline: { color: "#444460", fontSize: 12, letterSpacing: 3, marginTop: 4 },
  alertBar: { backgroundColor: "#180810", borderLeftWidth: 3, borderLeftColor: "#FF2D55", borderRadius: 10, padding: 12, marginBottom: 16 },
  alertTitle: { color: "#FF2D55", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  alertSub: { color: "rgba(240,240,255,.7)", fontSize: 11, marginTop: 2 },
  card: { backgroundColor: "#14142A", borderWidth: 1, borderColor: "#252540", borderRadius: 14, padding: 16, marginBottom: 20 },
  cardLabel: { color: "#666680", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 10 },
  input: { backgroundColor: "#1A1A32", borderWidth: 1, borderColor: "#252540", borderRadius: 8, padding: 14, color: "#F0F0FF", fontSize: 15, marginBottom: 10 },
  btn: { backgroundColor: "#FF2D55", borderRadius: 8, padding: 15, alignItems: "center" },
  btnSafe: { backgroundColor: "#00E676", marginTop: 10 },
  btnDanger: { backgroundColor: "#FF2D55", marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  error: { color: "#FF2D55", fontSize: 11, marginTop: 8 },
  sampleLabel: { color: "#444460", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 10 },
  sampleBtn: { backgroundColor: "#14142A", borderWidth: 1, borderColor: "#252540", borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  sampleId: { color: "#F0F0FF", fontSize: 13 },
  sampleStatus: { color: "#666680", fontSize: 12 },
  hero: { borderRadius: 14, padding: 24, alignItems: "center", marginBottom: 14 },
  heroSafe: { backgroundColor: "#0A1610", borderWidth: 1, borderColor: "rgba(0,230,118,.3)" },
  heroDanger: { backgroundColor: "#160A0E", borderWidth: 1, borderColor: "rgba(255,45,85,.3)" },
  heroEmoji: { fontSize: 48, marginBottom: 10 },
  verdict: { fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  verdictSub: { color: "#666680", fontSize: 11, marginTop: 6, textAlign: "center" },
  meterId: { color: "#444460", fontSize: 10, marginTop: 8 },
  row: { borderRadius: 10, padding: 12, marginBottom: 7, flexDirection: "row", alignItems: "center", gap: 10 },
  rowSafe: { backgroundColor: "#0A1610", borderWidth: 1, borderColor: "rgba(0,230,118,.15)" },
  rowDanger: { backgroundColor: "#160A0E", borderWidth: 1, borderColor: "rgba(255,45,85,.15)" },
  rowIcon: { fontSize: 18, width: 24 },
  rowLabel: { color: "#666680", fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  rowValue: { color: "#F0F0FF", fontSize: 12, fontWeight: "600", marginTop: 2 },
  back: { alignItems: "center", marginTop: 14, padding: 10 },
  backText: { color: "#444460", fontSize: 12 },
});