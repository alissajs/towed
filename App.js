import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, Platform } from "react-native";

const NYC_API = "https://data.cityofnewyork.us/resource/mvib-nh9w.json";

function parseHours(hoursStr) {
  if (!hoursStr) return { safe: true, info: "No restrictions found" };
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const str = hoursStr.toUpperCase();
  const isWeekday = day >= 1 && day <= 5;
  const isSaturday = day === 6;
  const isSunday = day === 0;
  if (str.includes("MON-SAT")) {
    if (isSunday) return { safe: true, info: "No restrictions on Sunday" };
    const match = str.match(/(\d{4})-(\d{4})/);
    if (match) {
      const start = parseInt(match[1].slice(0,2));
      const end = parseInt(match[2].slice(0,2));
      if (hour >= start && hour < end) {
        return { safe: false, info: `Restricted ${match[1]}–${match[2]} Mon–Sat` };
      }
      return { safe: true, info: `Safe now. Restrictions ${match[1]}–${match[2]} Mon–Sat` };
    }
  }
  if (str.includes("MON-FRI")) {
    if (!isWeekday) return { safe: true, info: "No restrictions on weekends" };
    const match = str.match(/(\d{4})-(\d{4})/);
    if (match) {
      const start = parseInt(match[1].slice(0,2));
      const end = parseInt(match[2].slice(0,2));
      if (hour >= start && hour < end) {
        return { safe: false, info: `Restricted ${match[1]}–${match[2]} Mon–Fri` };
      }
      return { safe: true, info: `Safe now. Restrictions ${match[1]}–${match[2]} Mon–Fri` };
    }
  }
  return { safe: true, info: hoursStr };
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [nearbyMeters, setNearbyMeters] = useState([]);

  const getLocation = async () => {
    setLocLoading(true);
    try {
      if (Platform.OS === 'web') {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ latitude, longitude });
            await fetchNearby(latitude, longitude);
            setLocLoading(false);
          },
          (err) => {
            setError("Location access denied. Type a meter number instead.");
            setLocLoading(false);
          }
        );
      }
    } catch (e) {
      setLocLoading(false);
    }
  };

  const fetchNearby = async (lat, lng) => {
    try {
      const delta = 0.003;
      const url = `${NYC_API}?$where=latitude>${lat-delta} AND latitude<${lat+delta} AND longitude>${lng-delta} AND longitude<${lng+delta}&$limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      setNearbyMeters(data);
    } catch (e) {}
  };

  const checkMeter = async () => {
    const val = input.trim();
    if (!val) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const url = `${NYC_API}?meter_number=${encodeURIComponent(val)}&$limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        const meter = data[0];
        const parsed = parseHours(meter.meter_hours);
        setResult({ ...meter, ...parsed });
      } else {
        setError("Meter not found. Check the number on the post and try again.");
      }
    } catch (e) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const reset = () => { setResult(null); setInput(""); setError(""); };

  useEffect(() => { getLocation(); }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.logo}>TOW<Text style={s.red}>ED</Text></Text>
          <Text style={s.tagline}>NYC Parking Survival</Text>
        </View>

        {!result ? (
          <View>
            {/* Location status */}
            {locLoading && (
              <View style={s.locBar}>
                <ActivityIndicator color="#FF2D55" size="small" />
                <Text style={s.locText}>Getting your location...</Text>
              </View>
            )}
            {location && !locLoading && (
              <View style={s.locBar}>
                <Text style={s.locDot}>📍</Text>
                <Text style={s.locText}>Location detected — showing nearby meters</Text>
              </View>
            )}

            {/* Alert banner */}
            <View style={s.alertBar}>
              <Text style={s.alertTitle}>⚠ LIVE DATA — NYC DOT</Text>
              <Text style={s.alertSub}>Real-time parking rules for all 15,598 NYC meters</Text>
            </View>

            {/* Lookup */}
            <View style={s.card}>
              <Text style={s.cardLabel}>METER LOOKUP</Text>
              <TextInput
                style={s.input}
                placeholder="Enter meter number from the post"
                placeholderTextColor="#666680"
                value={input}
                onChangeText={setInput}
                autoCapitalize="none"
                keyboardType="numeric"
                onSubmitEditing={checkMeter}
              />
              <TouchableOpacity style={s.btn} onPress={checkMeter}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>CHECK THIS METER →</Text>}
              </TouchableOpacity>
              {error ? <Text style={s.error}>{error}</Text> : null}
            </View>

            {/* Nearby meters from geolocation */}
            {nearbyMeters.length > 0 && (
              <View>
                <Text style={s.sectionLabel}>METERS NEAR YOU</Text>
                {nearbyMeters.map((m, i) => {
                  const parsed = parseHours(m.meter_hours);
                  return (
                    <TouchableOpacity key={i} style={s.nearbyItem} onPress={() => { setInput(m.meter_number); }}>
                      <Text style={[s.nearbyStatus, { color: parsed.safe ? "#00E676" : "#FF2D55" }]}>
                        {parsed.safe ? "✅" : "🚨"}
                      </Text>
                      <View style={{flex:1}}>
                        <Text style={s.nearbyStreet}>{m.on_street || "Unknown Street"}</Text>
                        <Text style={s.nearbyDetail}>Meter #{m.meter_number} · {m.borough}</Text>
                        <Text style={[s.nearbyHours, {color: parsed.safe ? "#00E676" : "#FF2D55"}]}>{parsed.info}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={s.hint}>💡 The meter number is printed on the sticker on the parking post next to your car</Text>
          </View>
        ) : (
          <View>
            <View style={[s.hero, result.safe ? s.heroSafe : s.heroDanger]}>
              <Text style={s.heroEmoji}>{result.safe ? "✅" : "🚨"}</Text>
              <Text style={[s.verdict, result.safe ? s.green : s.red]}>
                {result.safe ? "SAFE TO PARK" : "DO NOT PARK"}
              </Text>
              <Text style={s.verdictSub}>{result.info}</Text>
              <Text style={s.meterId}>METER #{input.trim()}</Text>
            </View>

            {[
              { icon: "📍", label: "Street", value: result.on_street || result.street },
              { icon: "🔀", label: "Between", value: `${result.from_street} & ${result.to_street}` },
              { icon: "🏙", label: "Borough", value: result.borough },
              { icon: "🕐", label: "Meter Hours", value: result.meter_hours || "No hours listed" },
              { icon: "📱", label: "Pay By Phone", value: result.pay_by_cell_number ? `#${result.pay_by_cell_number}` : "N/A" },
              { icon: "🔋", label: "Status", value: result.status || "Active" },
            ].map((row, i) => (
              <View key={i} style={[s.row, result.safe ? s.rowSafe : s.rowDanger]}>
                <Text style={s.rowIcon}>{row.icon}</Text>
                <View style={{flex:1}}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={s.rowValue}>{row.value}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={[s.btn, result.safe ? s.btnSafe : s.btnDanger]} onPress={reset}>
              <Text style={[s.btnText, result.safe && { color: "#001A0A" }]}>
                {result.safe ? "🔔 Set Move Reminder" : "🗺 Find Safe Parking Nearby"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.back} onPress={reset}>
              <Text style={s.backText}>← Check Another Meter</Text>
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
  locBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#14142A", borderRadius: 10, padding: 10, marginBottom: 12 },
  locDot: { fontSize: 14 },
  locText: { color: "#666680", fontSize: 12 },
  alertBar: { backgroundColor: "#0A1018", borderLeftWidth: 3, borderLeftColor: "#FF2D55", borderRadius: 10, padding: 12, marginBottom: 16 },
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
  sectionLabel: { color: "#444460", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 10 },
  nearbyItem: { backgroundColor: "#14142A", borderWidth: 1, borderColor: "#252540", borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  nearbyStatus: { fontSize: 20 },
  nearbyStreet: { color: "#F0F0FF", fontSize: 13, fontWeight: "600" },
  nearbyDetail: { color: "#666680", fontSize: 11, marginTop: 2 },
  nearbyHours: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  hint: { color: "#444460", fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 16 },
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