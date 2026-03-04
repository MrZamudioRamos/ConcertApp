import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, Pressable, StyleSheet,
  ActivityIndicator, SafeAreaView, RefreshControl, Animated
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

function useCountdown(dateStr?: string) {
  const [cd, setCd] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });
  useFocusEffect(useCallback(() => {
    if (!dateStr) return;
    const tick = () => {
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff <= 0) return;
      setCd({
        days: Math.floor(diff / 86400000),
        hrs:  Math.floor((diff % 86400000) / 3600000),
        min:  Math.floor((diff % 3600000) / 60000),
        sec:  Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]));
  return cd;
}

function ConcertCard({ item, onDelete }: { item: any; onDelete: (id: string) => void }) {
  const cd = useCountdown(item.date);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/concierto/${item.tm_id}`)}
    >
      {/* Imagen con gradiente */}
      <View style={styles.cardImageContainer}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          : <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
        }
        <LinearGradient
          colors={['transparent', 'rgba(13,13,20,0.95)']}
          style={StyleSheet.absoluteFillObject}
          locations={[0.3, 1]}
        />
        {/* Badge días restantes */}
        {item.date && (
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeNumber}>{cd.days}</Text>
            <Text style={styles.daysBadgeLabel}>días</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardGenre}>MÚSICA • CONCIERTO</Text>
          <Pressable onPress={() => onDelete(item.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color="#555" />
          </Pressable>
        </View>

        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

        {/* Fecha y venue */}
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color="#8888AA" />
          <Text style={styles.cardMetaText}>
            {item.date
              ? new Date(item.date).toLocaleDateString('es-ES',
                  { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Fecha por confirmar'}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color="#8888AA" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {[item.venue, item.city].filter(Boolean).join(', ')}
          </Text>
        </View>

        {/* Cuenta regresiva */}
        {item.date && (
          <View style={styles.countdownRow}>
            {[
              { v: cd.days, l: 'DÍAS' },
              { v: cd.hrs,  l: 'HRS' },
              { v: cd.min,  l: 'MIN', accent: true },
              { v: cd.sec,  l: 'SEG', accent: true },
            ].map((x, i) => (
              <View key={i} style={styles.cdItem}>
                <Text style={[styles.cdNum, x.accent && { color: '#E4156B' }]}>
                  {String(x.v).padStart(2, '0')}
                </Text>
                <Text style={styles.cdLabel}>{x.l}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function MisConciertos() {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConcerts = async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const { data } = await supabase
      .from('saved_concerts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    setConcerts(data ?? []);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchConcerts(); }, [user]));

  const handleDelete = async (id: string) => {
    await supabase.from('saved_concerts').delete().eq('id', id);
    setConcerts(prev => prev.filter(c => c.id !== id));
  };

  const upcoming = concerts.filter(c => c.date && new Date(c.date) > new Date());
  const past = concerts.filter(c => c.date && new Date(c.date) <= new Date());

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#E4156B" size="large" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={upcoming}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ConcertCard item={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchConcerts(true)}
            tintColor="#E4156B"
            colors={['#E4156B']}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>MIS CONCIERTOS</Text>
            {concerts.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Ionicons name="ticket" size={14} color="#E4156B" />
                  <Text style={styles.statText}>{upcoming.length} próximos</Text>
                </View>
                {past.length > 0 && (
                  <View style={styles.statChip}>
                    <Ionicons name="checkmark-circle" size={14} color="#8888AA" />
                    <Text style={[styles.statText, { color: '#8888AA' }]}>
                      {past.length} pasados
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="musical-notes-outline" size={64} color="#1A1A2E" />
            <Text style={styles.emptyTitle}>Aún no tienes conciertos</Text>
            <Text style={styles.emptySubtitle}>
              Busca y guarda tus próximos conciertos
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/buscar')}
            >
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Descubrir conciertos</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          past.length > 0 ? (
            <View style={styles.pastSection}>
              <Text style={styles.pastTitle}>PASADOS</Text>
              {past.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.pastCard}
                  onPress={() => router.push(`/concierto/${item.tm_id}`)}
                >
                  {item.image_url && (
                    <Image source={{ uri: item.image_url }} style={styles.pastImage} />
                  )}
                  <View style={styles.pastInfo}>
                    <Text style={styles.pastName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.pastMeta}>
                      {new Date(item.date).toLocaleDateString('es-ES',
                        { day: 'numeric', month: 'short', year: 'numeric' })}
                      {item.city ? ` · ${item.city}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color="#555" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0D0D14' },
  center:             { flex: 1, justifyContent: 'center',
                        alignItems: 'center', backgroundColor: '#0D0D14' },
  title:              { color: 'white', fontSize: 28, fontWeight: '800',
                        letterSpacing: 2, marginBottom: 12 },
  statsRow:           { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statChip:           { flexDirection: 'row', alignItems: 'center', gap: 6,
                        backgroundColor: '#1A1A2E', paddingHorizontal: 12,
                        paddingVertical: 6, borderRadius: 20 },
  statText:           { color: '#E4156B', fontSize: 12, fontWeight: '700' },

  // Card
  card:               { backgroundColor: '#1A1A2E', borderRadius: 16,
                        marginBottom: 16, overflow: 'hidden' },
  cardImageContainer: { height: 160, position: 'relative' },
  cardImage:          { width: '100%', height: '100%' },
  cardImagePlaceholder: { backgroundColor: '#2a2a2a' },
  daysBadge:          { position: 'absolute', top: 12, right: 12,
                        backgroundColor: '#E4156B', borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 4,
                        alignItems: 'center', minWidth: 44 },
  daysBadgeNumber:    { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  daysBadgeLabel:     { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700' },
  cardContent:        { padding: 14 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 4 },
  cardGenre:          { color: '#E4156B', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardName:           { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardMeta:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardMetaText:       { color: '#8888AA', fontSize: 12, flex: 1 },
  countdownRow:       { flexDirection: 'row', gap: 16, marginTop: 12,
                        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#252535' },
  cdItem:             { alignItems: 'center', minWidth: 36 },
  cdNum:              { color: '#fff', fontSize: 18, fontWeight: '800' },
  cdLabel:            { color: '#8888AA', fontSize: 9, fontWeight: '700',
                        letterSpacing: 1, marginTop: 2 },

  // Empty
  empty:              { flex: 1, justifyContent: 'center', alignItems: 'center',
                        gap: 12, paddingTop: 80 },
  emptyTitle:         { color: '#fff', fontSize: 20, fontWeight: '700' },
  emptySubtitle:      { color: '#8888AA', fontSize: 14, textAlign: 'center' },
  emptyBtn:           { flexDirection: 'row', alignItems: 'center', gap: 8,
                        marginTop: 8, backgroundColor: '#E4156B',
                        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText:       { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Pasados
  pastSection:        { marginTop: 8, marginBottom: 16 },
  pastTitle:          { color: '#555', fontSize: 11, fontWeight: '700',
                        letterSpacing: 2, marginBottom: 10 },
  pastCard:           { flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#111118', borderRadius: 12,
                        padding: 10, marginBottom: 8, gap: 12, opacity: 0.6 },
  pastImage:          { width: 44, height: 44, borderRadius: 8 },
  pastInfo:           { flex: 1 },
  pastName:           { color: '#fff', fontSize: 14, fontWeight: '700' },
  pastMeta:           { color: '#555', fontSize: 12, marginTop: 2 },
});
