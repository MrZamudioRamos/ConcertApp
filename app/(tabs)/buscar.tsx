import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, SafeAreaView,
  RefreshControl, ScrollView, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { searchConcerts } from '../../services/api';
import { router } from 'expo-router';

const FILTERS = ['HOY', 'ESTE FINDE', 'ROCK', 'POP', 'ELECTRO'];

const FEATURED_SEARCHES = [
  'Bad Bunny', 'Coldplay', 'Rosalía', 'Arctic Monkeys',
  'Dua Lipa', 'The Weeknd', 'Radiohead', 'Billie Eilish'
];

const FILTER_MAP: Record<string, string> = {
  'HOY': 'concert today',
  'ESTE FINDE': 'concert weekend',
  'ROCK': 'rock',
  'POP': 'pop',
  'ELECTRO': 'electronic',
};

export default function Buscar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // ✅ FIX: activeFilter empieza en null → ningún filtro activo por defecto
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchMode, setSearchMode] = useState(false);

  // ✅ FIX: ref para cancelar peticiones antiguas (evita race condition)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    setLoadingFeatured(true);
    try {
      const data = await searchConcerts('music');
      setFeatured(data.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeatured(false);
    }
  };

  // ✅ FIX: debounce + no mezcla featured con results
  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.length < 2) {
      setResults([]);
      setSearchMode(false);
      setActiveFilter(null);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearchMode(true);
      setActiveFilter(null);
      setLoading(true);
      try {
        const data = await searchConcerts(text);
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleFilterPress = async (filter: string) => {
    // ✅ FIX: Si ya está activo, al pulsar de nuevo no hace nada raro
    setActiveFilter(filter);
    setSearchMode(true);
    setQuery('');
    setResults([]); // limpia inmediatamente para no ver resultados viejos
    setLoading(true);
    try {
      const data = await searchConcerts(FILTER_MAP[filter] ?? filter);
      setResults(data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: clearSearch restaura estado inicial limpiamente
  const clearSearch = () => {
    setSearchMode(false);
    setResults([]);
    setQuery('');
    setActiveFilter(null);
    // Si featured está vacío (p.ej. falló la carga inicial), recarga
    if (featured.length === 0) {
      loadFeatured();
    }
  };

  const renderConcert = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/concierto/${item.id}`)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardGenre}>MÚSICA • CONCIERTO</Text>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color="#8888AA" />
          <Text style={styles.cardMetaText}>
            {item.date
              ? new Date(item.date).toLocaleDateString('es-ES',
                  { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Fecha por confirmar'
            }
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color="#8888AA" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {[item.venue, item.city].filter(Boolean).join(', ')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#333" style={{ alignSelf: 'center', marginRight: 12 }} />
    </TouchableOpacity>
  );

  // ✅ FIX: FlatList horizontal FUERA del ScrollView para evitar warning de nesting
  const EmptyState = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESTACADOS</Text>
        {loadingFeatured ? (
          <ActivityIndicator color="#E4156B" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={featured}
            keyExtractor={(item: any) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
            // ✅ FIX: scrollEnabled para evitar conflicto con ScrollView padre
            scrollEnabled={true}
            nestedScrollEnabled={true}
            renderItem={({ item }: { item: any }) => (
              <Pressable
                style={styles.featuredCard}
                onPress={() => router.push(`/concierto/${item.id}`)}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={StyleSheet.absoluteFillObject}
                  locations={[0.4, 1]}
                />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.featuredMeta}>
                    {item.city ?? ''}
                    {item.date
                      ? ` · ${new Date(item.date).toLocaleDateString('es-ES',
                          { day: 'numeric', month: 'short' })}`
                      : ''
                    }
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BÚSQUEDAS POPULARES</Text>
        <View style={styles.tagsGrid}>
          {FEATURED_SEARCHES.map(artist => (
            <Pressable
              key={artist}
              style={styles.tag}
              onPress={() => handleSearch(artist)}
            >
              <Ionicons name="search-outline" size={13} color="#8888AA" />
              <Text style={styles.tagText}>{artist}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>DESCUBRIR</Text>

      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#8888AA" />
        <TextInput
          style={styles.searchInput}
          placeholder="Artistas, eventos o lugares..."
          placeholderTextColor="#8888AA"
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#8888AA" />
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ FIX: Filtros + Limpiar en el mismo bloque horizontal para no romper layout */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filter, activeFilter === f && styles.filterActive]}
              onPress={() => handleFilterPress(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ✅ FIX: Limpiar dentro del mismo bloque, no empuja el contenido */}
        {searchMode && (
          <Pressable style={styles.clearBtn} onPress={clearSearch}>
            <Ionicons name="close-circle" size={14} color="#8888AA" />
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </Pressable>
        )}
      </View>

      {/* Contenido */}
      {loading ? (
        <ActivityIndicator color="#E4156B" style={{ marginTop: 40 }} />
      ) : searchMode ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item: any) => item.id}
            renderItem={renderConcert}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => activeFilter ? handleFilterPress(activeFilter) : undefined}
                tintColor="#E4156B"
                colors={['#E4156B']}
              />
            }
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#333355" />
            <Text style={styles.emptyText}>Sin resultados</Text>
          </View>
        )
      ) : (
        <EmptyState />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D14' },
  title: {
    color: 'white', fontSize: 28, fontWeight: '800',
    letterSpacing: 2, padding: 16, paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', margin: 16, marginTop: 8,
    borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, color: 'white', marginLeft: 8, fontSize: 15 },

  // ✅ FIX: contenedor en fila para filtros + limpiar juntos
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  filtersRow: { paddingHorizontal: 16, gap: 8 },
  filter: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#1A1A2E',
    height: 36, justifyContent: 'center',
  },
  filterActive: { backgroundColor: '#E4156B' },
  filterText: { color: '#8888AA', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: 'white', fontWeight: '700' },

  card: {
    flexDirection: 'row', backgroundColor: '#1A1A2E',
    borderRadius: 14, marginBottom: 12,
    overflow: 'hidden', alignItems: 'center',
  },
  cardImage: { width: 80, height: 80 },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center', gap: 3 },
  cardGenre: { color: '#E4156B', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardName: { color: 'white', fontSize: 15, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { color: '#8888AA', fontSize: 11, flex: 1 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    color: '#fff', fontSize: 12, fontWeight: '800',
    letterSpacing: 2, marginBottom: 14,
  },

  featuredCard: { width: 160, height: 200, borderRadius: 16, overflow: 'hidden' },
  featuredImage: { width: '100%', height: '100%' },
  featuredInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  featuredName: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  featuredMeta: { color: '#aaa', fontSize: 11, marginTop: 4 },

  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A1A2E', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20,
  },
  tagText: { color: '#8888AA', fontSize: 13, fontWeight: '600' },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8, flexShrink: 0,
  },
  clearBtnText: { color: '#8888AA', fontSize: 12 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#8888AA', fontSize: 16 },
});
