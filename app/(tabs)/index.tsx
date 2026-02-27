import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, Pressable,
  StyleSheet, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

export default function MisConciertos() {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConcerts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('saved_concerts')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });
    setConcerts(data ?? []);
    setLoading(false);
  };

  // Se recarga cada vez que el usuario vuelve a esta pestaña
  useFocusEffect(useCallback(() => { fetchConcerts(); }, [user]));

  const handleDelete = async (id: string) => {
    await supabase.from('saved_concerts').delete().eq('id', id);
    setConcerts(prev => prev.filter(c => c.id !== id));
  };

  const renderConcert = ({ item }: { item: any }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/concierto/${item.tm_id}`)}
    >
      {item.image_url
        ? <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        : <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      }
      <View style={styles.cardInfo}>
        <Text style={styles.cardGenre}>MÚSICA • CONCIERTO</Text>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardMeta}>
          {item.date && (
            <>
              <Ionicons name="calendar-outline" size={12} color="#8888AA" />
              <Text style={styles.cardMetaText}>
                {new Date(item.date).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </Text>
            </>
          )}
          {item.venue && (
            <>
              <Ionicons name="location-outline" size={12} color="#8888AA" style={{ marginLeft: 8 }} />
              <Text style={styles.cardMetaText} numberOfLines={1}>{item.venue}</Text>
            </>
          )}
        </View>
      </View>

      {/* Botón eliminar */}
      <Pressable
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color="#E4156B" />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MIS CONCIERTOS</Text>

      {loading ? (
        <ActivityIndicator color="#E4156B" style={{ marginTop: 40 }} />
      ) : concerts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={56} color="#333355" />
          <Text style={styles.emptyTitle}>Aún no tienes conciertos</Text>
          <Text style={styles.emptySubtitle}>
            Busca y guarda tus próximos conciertos
          </Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/buscar')}
          >
            <Text style={styles.emptyBtnText}>Descubrir conciertos</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={concerts}
          keyExtractor={item => item.id}
          renderItem={renderConcert}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#0D0D14' },
  title:                { color: 'white', fontSize: 28, fontWeight: '800',
                          letterSpacing: 2, padding: 16, paddingBottom: 8 },
  card:                 { flexDirection: 'row', backgroundColor: '#1A1A2E',
                          borderRadius: 12, marginBottom: 12,
                          overflow: 'hidden', alignItems: 'center' },
  cardImage:            { width: 90, height: 90 },
  cardImagePlaceholder: { backgroundColor: '#2a2a2a' },
  cardInfo:             { flex: 1, padding: 12, justifyContent: 'center' },
  cardGenre:            { color: '#E4156B', fontSize: 10, fontWeight: '700',
                          letterSpacing: 1, marginBottom: 4 },
  cardName:             { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cardMeta:             { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardMetaText:         { color: '#8888AA', fontSize: 11, marginLeft: 4 },
  deleteBtn:            { padding: 12 },
  empty:                { flex: 1, justifyContent: 'center',
                          alignItems: 'center', gap: 12, padding: 32 },
  emptyTitle:           { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtitle:        { color: '#8888AA', fontSize: 14, textAlign: 'center' },
  emptyBtn:             { marginTop: 8, backgroundColor: '#E4156B',
                          paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText:         { color: '#fff', fontWeight: '700', fontSize: 15 },
});
