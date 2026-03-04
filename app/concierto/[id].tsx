import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, Pressable,
  ActivityIndicator, StyleSheet, Linking, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getConcertById, searchConcerts } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Por confirmar';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long'
  }).toUpperCase();
}

function formatDay(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long'
  }).toUpperCase();
}

export default function ConciertoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [concert, setConcert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [similar, setSimilar] = useState<any[]>([]);

  useEffect(() => {
    getConcertById(id)
      .then(async data => {
        setConcert(data);
        setLoading(false);

        // Comprobar si ya está guardado
        if (user) {
          const { data: existing } = await supabase
            .from('saved_concerts').select('id')
            .eq('user_id', user.id).eq('tm_id', id).single();
          if (existing) setSaved(true);
        }

        // Buscar eventos similares
        if (data.artists?.[0]?.name) {
          const results = await searchConcerts(data.artists[0].name);
          setSimilar(results.filter((e: any) => e.id !== id).slice(0, 4));
        }
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    if (!user || saving || saved) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("savedconcerts").insert({
        userid: user.id,
        tmid: concert.id,
        name: concert.name,
        date: concert.date,
        venue: concert.venue,
        city: concert.city,
        imageurl: concert.imageUrl,
        ticketurl: concert.ticketUrl,
        savedat: new Date().toISOString(),
      });
      if (!error) setSaved(true);
      else if (error.code === "23505") setSaved(true);
      else console.error("Error guardando:", error);
    } finally {
      setSaving(false);
    }
  };

  const openWaze = () => {
    if (!concert?.venue) return;
    const query = encodeURIComponent(`${concert.venue} ${concert.city ?? ''}`);
    Linking.openURL(`https://waze.com/ul?q=${query}`);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#E4156B" />
    </View>
  );

  if (error || !concert) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color="#E4156B" />
      <Text style={styles.errorText}>No se pudo cargar el concierto</Text>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Volver</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.heroContainer}>
          {concert.imageUrl ? (
            <Image
              source={{ uri: concert.imageUrl }}
              style={styles.heroImage}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(13,13,20,0.6)", "#0D0D14"]}
            style={StyleSheet.absoluteFillObject}
            locations={[0.2, 0.7, 1]}
          />

          {/* Nav */}
          <View style={styles.heroNav}>
            <Pressable style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.navBtn}
              onPress={() =>
                concert.ticketUrl && Linking.openURL(concert.ticketUrl)
              }
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Info sobre imagen */}
          <View style={styles.heroContent}>
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>EVENTO CONFIRMADO</Text>
            </View>
            <Text style={styles.heroTitle}>{concert.name}</Text>
            {concert.genre && (
              <Text style={styles.heroSubtitle}>
                {concert.genre.toUpperCase()} •{" "}
                {new Date(concert.date ?? "").getFullYear()}
              </Text>
            )}
          </View>
          {/* Botón comprar entradas sobre imagen */}
          {concert.ticketUrl && (
            <Pressable
              style={styles.ticketFloatBtn}
              onPress={() => Linking.openURL(concert.ticketUrl)}
            >
              <Ionicons name="ticket" size={20} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* ── FECHA Y LUGAR ── */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>FECHA</Text>
            <Text style={styles.infoCardMain}>{formatDate(concert.date)}</Text>
            <Text style={styles.infoCardSub}>
              {formatDay(concert.date)}
              {concert.time ? ` · ${concert.time} HRS` : ""}
            </Text>
          </View>
          <View style={styles.infoCardDivider} />
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>LUGAR</Text>
            <Text style={styles.infoCardMain}>
              {concert.venue?.toUpperCase()}
            </Text>
            <Text style={styles.infoCardSub}>
              {[concert.city, concert.country]
                .filter(Boolean)
                .join(", ")
                .toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── UBICACIÓN ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UBICACIÓN</Text>
            <Pressable onPress={openWaze} style={styles.wazeBtn}>
              <Text style={styles.wazeBtnText}>ABRIR EN WAZE</Text>
              <Ionicons name="arrow-forward" size={12} color="#E4156B" />
            </Pressable>
          </View>
          <Pressable style={styles.mapPlaceholder} onPress={openWaze}>
            <View style={styles.mapContent}>
              <Ionicons name="location" size={36} color="#E4156B" />
              <Text style={styles.mapVenueName}>{concert.venue}</Text>
              <Text style={styles.mapVenueCity}>{concert.city}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── LINEUP & HORARIOS ── */}
        {concert.artists?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LINEUP & HORARIOS</Text>
            {concert.artists.map((a: any, i: number) => (
              <View
                key={a.id}
                style={[
                  styles.lineupRow,
                  i === concert.artists.length - 1 && styles.lineupRowMain,
                ]}
              >
                <View style={styles.lineupLeft}>
                  <View
                    style={[
                      styles.lineupBar,
                      i === concert.artists.length - 1 && {
                        backgroundColor: "#E4156B",
                      },
                    ]}
                  />
                  <View>
                    <Text style={styles.lineupTime}>
                      {concert.time
                        ? `${String(parseInt(concert.time) - (concert.artists.length - 1 - i) * 2).padStart(2, "0")}:${concert.time.split(":")[1]}`
                        : "--:--"}
                    </Text>
                  </View>
                </View>
                <View style={styles.lineupInfo}>
                  <Text
                    style={[
                      styles.lineupName,
                      i === concert.artists.length - 1 && { color: "#E4156B" },
                    ]}
                  >
                    {a.name.toUpperCase()}
                  </Text>
                  <Text style={styles.lineupRole}>
                    {i === concert.artists.length - 1
                      ? "MAIN EVENT"
                      : "APERTURA"}
                  </Text>
                </View>
                <Ionicons
                  name="musical-note"
                  size={16}
                  color={
                    i === concert.artists.length - 1 ? "#E4156B" : "#8888AA"
                  }
                />
              </View>
            ))}
          </View>
        )}

        {/* ── EVENTOS SIMILARES ── */}
        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EVENTOS SIMILARES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {similar.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.similarCard}
                  onPress={() => router.push(`/concierto/${item.id}`)}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.similarImage}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.similarInfo}>
                    <Text style={styles.similarName}>
                      {item.name.toUpperCase()}
                    </Text>
                    <Text style={styles.similarMeta}>
                      {item.date
                        ? new Date(item.date)
                            .toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                            })
                            .toUpperCase()
                        : ""}{" "}
                      · {item.city ?? ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BOTÓN FIJO INFERIOR ── */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.addButton, saved && styles.addButtonSaved]}
          onPress={handleSave}
          disabled={saved || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={saved ? "checkmark-circle" : "add-circle-outline"}
                size={22}
                color="#fff"
              />
              <Text style={styles.addButtonText}>
                {saved ? "GUARDADO ✓" : "AÑADIR A MIS CONCIERTOS"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0D0D14' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center',
                      backgroundColor: '#0D0D14', gap: 12, padding: 24 },
  errorText:        { color: '#fff', fontSize: 16, textAlign: 'center' },
  backBtn:          { backgroundColor: '#E4156B', paddingHorizontal: 24,
                      paddingVertical: 10, borderRadius: 10 },
  backBtnText:      { color: '#fff', fontWeight: '700' },

  // Hero
  heroContainer:    { height: 420, justifyContent: 'flex-end' },
  heroImage:        { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder:  { backgroundColor: '#1A1A2E' },
  heroNav:          { position: 'absolute', top: 48, left: 0, right: 0,
                      flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between', paddingHorizontal: 16 },
  navBtn:           { backgroundColor: 'rgba(0,0,0,0.4)',
                      borderRadius: 20, padding: 8 },
  heroNavTitle:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  heroContent:      { padding: 20, paddingBottom: 24 },
  confirmedBadge:   { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#00CFFF',
                      borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
                      marginBottom: 12 },
  confirmedText:    { color: '#00CFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle:        { color: '#fff', fontSize: 36, fontWeight: '900',
                      lineHeight: 40, letterSpacing: -0.5 },
  heroSubtitle:     { color: '#8888AA', fontSize: 13, fontWeight: '600',
                      letterSpacing: 1, marginTop: 6 },

  // Info cards
  infoCards:        { flexDirection: 'row', marginHorizontal: 16, marginTop: 4,
                      backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20 },
  infoCard:         { flex: 1, gap: 4 },
  infoCardDivider:  { width: 1, backgroundColor: '#333', marginHorizontal: 16 },
  infoCardLabel:    { color: '#8888AA', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  infoCardMain:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  infoCardSub:      { color: '#8888AA', fontSize: 11 },

  // Sections
  section:          { marginTop: 28, paddingHorizontal: 16 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 14 },
  sectionTitle:     { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  wazeBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wazeBtnText:      { color: '#E4156B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Mapa
  mapPlaceholder:   { height: 140, backgroundColor: '#0A0A1A', borderRadius: 16,
                      justifyContent: 'center', alignItems: 'center',
                      borderWidth: 1, borderColor: '#1A1A2E' },
  mapContent:       { alignItems: 'center', gap: 4 },
  mapVenueName:     { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  mapVenueCity:     { color: '#8888AA', fontSize: 12 },

  // Lineup
  lineupRow:        { flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#1A1A2E', borderRadius: 12,
                      padding: 14, marginBottom: 8, gap: 12 },
  lineupRowMain:    { backgroundColor: '#1A0A12' },
  lineupLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineupBar:        { width: 3, height: 36, borderRadius: 2, backgroundColor: '#8888AA' },
  lineupTime:       { color: '#8888AA', fontSize: 14, fontWeight: '700', minWidth: 40 },
  lineupInfo:       { flex: 1 },
  lineupName:       { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  lineupRole:       { color: '#8888AA', fontSize: 11, marginTop: 2 },

  // Similar
  similarCard:      { width: 140, height: 160, borderRadius: 12, overflow: 'hidden' },
  similarImage:     { width: '100%', height: '100%' },
  similarInfo:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  similarName:      { color: '#fff', fontSize: 11, fontWeight: '800' },
  similarMeta:      { color: '#aaa', fontSize: 10, marginTop: 2 },

  // Bottom bar
  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0,
                      backgroundColor: '#0D0D14', paddingHorizontal: 16,
                      paddingBottom: Platform.OS === 'ios' ? 34 : 16, paddingTop: 12,
                      borderTopWidth: 1, borderTopColor: '#1A1A2E' },
  addButton:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, backgroundColor: '#E4156B', borderRadius: 14, padding: 18 },
  addButtonSaved:   { backgroundColor: '#2a2a2a' },
  addButtonText:    { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  ticketFloatBtn: {
  position: 'absolute',
  bottom: 24,
  right: 16,
  backgroundColor: '#E4156B',
  borderRadius: 50,
  padding: 12,
  shadowColor: '#E4156B',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
  elevation: 8,
},

});
