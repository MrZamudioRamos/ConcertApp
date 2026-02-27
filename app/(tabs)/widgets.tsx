import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Image, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import {
  registerForPushNotifications,
  scheduleConcertNotification,
  cancelConcertNotifications,
} from '../../services/notifications';
import { Alert } from 'react-native';

const ACCENT_COLORS = ['#00CFFF', '#E4156B', '#F5A623', '#9B59B6', '#2ECC71'];

export default function Widgets() {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [accent, setAccent] = useState(ACCENT_COLORS[0]);
  const [showCountdown, setShowCountdown] = useState(true);
  const [dynamicBg, setDynamicBg] = useState(true);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [notifDays, setNotifDays] = useState<number[]>([]);
  const [scheduling, setScheduling] = useState(false);

  
  // Cargar conciertos guardados
  useEffect(() => {
    if (!user) return;
    supabase
      .from('saved_concerts')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })
      .then(({ data }) => {
        setConcerts(data ?? []);
        if (data && data.length > 0) setSelected(data[0]);
        setLoading(false);
      });
  }, [user]);

  // Cuenta regresiva en tiempo real
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!selected?.date) return;

    const tick = () => {
      const diff = new Date(selected.date).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hrs: 0, min: 0, sec: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hrs:  Math.floor((diff % 86400000) / 3600000),
        min:  Math.floor((diff % 3600000) / 60000),
        sec:  Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [selected]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#E4156B" size="large" />
    </View>
  );

  if (concerts.length === 0) return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CREAR WIDGET</Text>
      <View style={styles.center}>
        <Ionicons name="albums-outline" size={56} color="#333355" />
        <Text style={styles.emptyTitle}>Sin conciertos guardados</Text>
        <Text style={styles.emptySubtitle}>
          Guarda algún concierto primero para crear tu widget
        </Text>
      </View>
    </SafeAreaView>
  );

  const handleScheduleNotifications = async () => {
  if (!selected?.date || notifDays.length === 0) {
    Alert.alert('Selecciona', 'Elige al menos un aviso y un concierto con fecha');
    return;
  }
  setScheduling(true);

  const token = await registerForPushNotifications();
  if (!token) {
    Alert.alert('Permisos', 'Necesitamos permiso para enviarte notificaciones');
    setScheduling(false);
    return;
  }

  let count = 0;
  for (const days of notifDays) {
    const id = await scheduleConcertNotification(selected.name, selected.date, days);
    if (id) count++;
  }

  setScheduling(false);
  Alert.alert(
    '✅ Avisos programados',
    `Recibirás ${count} notificación${count !== 1 ? 'es' : ''} antes de ${selected.name}`
  );
};


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CREAR WIDGET</Text>
          <Pressable>
            <Ionicons name="settings-outline" size={22} color="#8888AA" />
          </Pressable>
        </View>

        {/* Vista previa */}
        <View style={styles.previewSection}>
          <View style={styles.previewLabel}>
            <Text style={styles.previewLabelText}>VISTA PREVIA</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>En vivo</Text>
            </View>
          </View>

          {/* Widget card */}
          <View style={styles.widgetCard}>
            {selected?.image_url && (
              <Image
                source={{ uri: selected.image_url }}
                style={styles.widgetBg}
                blurRadius={dynamicBg ? 2 : 0}
              />
            )}
            <View style={styles.widgetOverlay} />

            {/* Badge gira */}
            <View style={[styles.tourBadge, { backgroundColor: accent }]}>
              <Text style={styles.tourBadgeText}>GIRA MUNDIAL</Text>
            </View>

            {/* Icono música */}
            <Ionicons
              name="musical-note"
              size={20}
              color={accent}
              style={styles.widgetMusicIcon}
            />

            {/* Info artista */}
            <View style={styles.widgetInfo}>
              <Text style={styles.widgetArtist}>{selected?.name}</Text>
              <View style={styles.widgetVenueRow}>
                <Ionicons name="location" size={12} color={accent} />
                <Text style={styles.widgetVenue}>
                  {selected?.venue ?? "Venue por confirmar"}
                  {selected?.city ? `, ${selected.city}` : ""}
                </Text>
              </View>
            </View>

            {/* Cuenta regresiva */}
            {showCountdown && (
              <View style={styles.countdownRow}>
                {[
                  { value: countdown.days, label: "DÍAS" },
                  { value: countdown.hrs, label: "HRS" },
                  { value: countdown.min, label: "MIN", accent: true },
                  { value: countdown.sec, label: "SEG", accent: true },
                ].map((item, i) => (
                  <View key={i} style={styles.countdownItem}>
                    <Text
                      style={[
                        styles.countdownNumber,
                        item.accent && { color: accent },
                      ]}
                    >
                      {String(item.value).padStart(2, "0")}
                    </Text>
                    <Text style={styles.countdownLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.previewHint}>
            Así se verá en tu pantalla de inicio
          </Text>
        </View>

        {/* Seleccionar concierto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seleccionar Artista</Text>
          <View style={styles.dropdown}>
            <Ionicons name="person-outline" size={18} color="#8888AA" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              {concerts.map((c) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.dropdownOption,
                    selected?.id === c.id && {
                      borderColor: accent,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setSelected(c)}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selected?.id === c.id && { color: accent },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Ionicons name="chevron-down" size={18} color="#8888AA" />
          </View>
        </View>

        {/* Colores de acento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estilo de Acento</Text>
          <View style={styles.colorsRow}>
            {ACCENT_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[styles.colorCircle, { backgroundColor: color }]}
                onPress={() => setAccent(color)}
              >
                {accent === color && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Opciones */}
        <View style={styles.section}>
          <Pressable style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="time-outline" size={20} color={accent} />
              <Text style={styles.optionText}>Mostrar cuenta regresiva</Text>
            </View>
            <Switch
              value={showCountdown}
              onValueChange={setShowCountdown}
              trackColor={{ false: "#333", true: accent }}
              thumbColor="#fff"
            />
          </Pressable>

          <Pressable style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="image-outline" size={20} color={accent} />
              <Text style={styles.optionText}>Fondo dinámico</Text>
            </View>
            <Switch
              value={dynamicBg}
              onValueChange={setDynamicBg}
              trackColor={{ false: "#333", true: accent }}
              thumbColor="#fff"
            />
          </Pressable>
        </View>
        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avisos del Concierto</Text>
          <Text style={styles.notifHint}>
            Recibe una notificación antes del concierto
          </Text>

          <View style={styles.notifGrid}>
            {[1, 3, 7, 14].map((days) => (
              <Pressable
                key={days}
                style={[
                  styles.notifChip,
                  notifDays.includes(days) && {
                    backgroundColor: accent,
                    borderColor: accent,
                  },
                ]}
                onPress={() =>
                  setNotifDays((prev) =>
                    prev.includes(days)
                      ? prev.filter((d) => d !== days)
                      : [...prev, days],
                  )
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={14}
                  color={notifDays.includes(days) ? "#fff" : "#8888AA"}
                />
                <Text
                  style={[
                    styles.notifChipText,
                    notifDays.includes(days) && { color: "#fff" },
                  ]}
                >
                  {days === 1 ? "1 día antes" : `${days} días antes`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: accent },
              scheduling && { opacity: 0.6 },
            ]}
            onPress={handleScheduleNotifications}
            disabled={scheduling}
          >
            {scheduling ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="notifications" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Programar avisos</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D14" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  title: { color: "white", fontSize: 28, fontWeight: "800", letterSpacing: 2 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptySubtitle: { color: "#8888AA", fontSize: 14, textAlign: "center" },
  previewSection: { paddingHorizontal: 16 },
  previewLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  previewLabelText: {
    color: "#8888AA",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  liveBadge: {
    backgroundColor: "#1A3A2A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveBadgeText: { color: "#2ECC71", fontSize: 12, fontWeight: "700" },
  widgetCard: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
    justifyContent: "flex-end",
  },
  widgetBg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  widgetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  tourBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tourBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  widgetMusicIcon: { position: "absolute", top: 14, right: 14 },
  widgetInfo: { padding: 14, paddingBottom: 8 },
  widgetArtist: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  widgetVenueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  widgetVenue: { color: "#ccc", fontSize: 12 },
  countdownRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 20,
  },
  countdownItem: { alignItems: "center" },
  countdownNumber: { color: "#fff", fontSize: 22, fontWeight: "800" },
  countdownLabel: {
    color: "#8888AA",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#0D0D14",
  },
  dropdownOptionText: { color: "#8888AA", fontSize: 14, fontWeight: "600" },
  colorsRow: { flexDirection: "row", gap: 14 },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionText: { color: "#fff", fontSize: 15 },
  previewHint: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  notifHint: { color: "#8888AA", fontSize: 13, marginBottom: 14 },
  notifGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  notifChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#1A1A2E",
  },
  notifChipText: { color: "#8888AA", fontSize: 13, fontWeight: "600" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    padding: 16,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
