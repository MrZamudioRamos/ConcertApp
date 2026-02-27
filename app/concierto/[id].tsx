import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView,
  Pressable, ActivityIndicator, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getConcertById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

export default function ConciertoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [concert, setConcert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    getConcertById(id)
      .then(async (data) => {
        setConcert(data);
        setLoading(false);

        // Comprobar si ya está guardado
        if (user) {
          const { data: existing } = await supabase
            .from("saved_concerts")
            .select("id")
            .eq("user_id", user.id)
            .eq("tm_id", id)
            .single();
          if (existing) setSaved(true);
        }
      })

      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

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

  const imageUrl = concert.imageUrl;
  const date     = concert.date;
  const time     = concert.time;
  const venue    = concert.venue;
  const city     = concert.city;
  const artists  = concert.artists ?? [];
  const priceMin = concert.priceMin;
  const priceMax = concert.priceMax;
  const genre    = concert.genre;
  const segment  = concert.segment;

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);

    const { error } = await supabase.from("saved_concerts").insert({
      user_id: user.id,
      tm_id: concert.id,
      name: concert.name,
      date: concert.date,
      venue: concert.venue,
      city: concert.city,
      image_url: concert.imageUrl,
      ticket_url: concert.ticketUrl,
    });

    setSaving(false);
    if (!error) setSaved(true);
  };


  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero */}
      <View style={styles.heroContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]} />
        )}
        <View style={styles.heroGradient} />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {/* Género */}
        {(segment || genre) && (
          <Text style={styles.genre}>
            {[segment, genre].filter(Boolean).join(" · ").toUpperCase()}
          </Text>
        )}

        {/* Título */}
        <Text style={styles.title}>{concert.name}</Text>

        {/* Fecha y hora */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#E4156B" />
          <Text style={styles.infoText}>
            {date ?? "Fecha por confirmar"}
            {time ? `  ·  ${time}h` : ""}
          </Text>
        </View>

        {/* Venue */}
        {venue && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#E4156B" />
            <Text style={styles.infoText}>
              {venue}
              {city ? `, ${city}` : ""}
            </Text>
          </View>
        )}

        {/* Precio */}
        {priceMin && (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={18} color="#E4156B" />
            <Text style={styles.infoText}>
              Desde {priceMin}€{priceMax ? `  ·  hasta ${priceMax}€` : ""}
            </Text>
          </View>
        )}

        {/* Artistas */}
        {artists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artistas</Text>
            {artists.map((a: any) => (
              <Text key={a.id} style={styles.artistName}>
                · {a.name}
              </Text>
            ))}
          </View>
        )}

        {/* Botón añadir */}
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
                {saved ? "Guardado" : "Añadir a Mis Conciertos"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#121212' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center',
                     backgroundColor: '#121212', gap: 12, padding: 24 },
  errorText:       { color: '#fff', fontSize: 16, textAlign: 'center' },
  backBtn:         { marginTop: 8, backgroundColor: '#E4156B',
                     paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  backBtnText:     { color: '#fff', fontWeight: '700' },
  heroContainer:   { position: 'relative', height: 280 },
  heroImage:       { width: '100%', height: 280 },
  heroPlaceholder: { backgroundColor: '#2a2a2a' },
  heroGradient:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  backButton:      { position: 'absolute', top: 48, left: 16,
                     backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 4 },
  content:         { padding: 20 },
  genre:           { color: '#E4156B', fontSize: 11, fontWeight: '700',
                     letterSpacing: 1, marginBottom: 8 },
  title:           { color: '#fff', fontSize: 24, fontWeight: '800',
                     lineHeight: 30, marginBottom: 20 },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoText:        { color: '#ccc', fontSize: 15, flex: 1 },
  section:         { marginTop: 24, marginBottom: 8 },
  sectionTitle:    { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  artistName:      { color: '#ccc', fontSize: 15, marginBottom: 6 },
  addButton:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                     gap: 8, backgroundColor: '#E4156B',
                     borderRadius: 14, padding: 16, marginTop: 32 },
  addButtonSaved:  { backgroundColor: '#2a2a2a' },
  addButtonText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
