import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchConcerts } from '../../services/api';
import { router } from 'expo-router';

const FILTERS = ['HOY', 'ESTE FINDE', 'ROCK', 'POP', 'ELECTRO'];

export default function Buscar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('HOY');

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchConcerts(text);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderConcert = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/concierto/${item.id}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardGenre}>MÚSICA • CONCIERTO</Text>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color="#8888AA" />
          <Text style={styles.cardMetaText}>
            {new Date(item.date).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </Text>
          <Ionicons name="location-outline" size={12} color="#8888AA" style={{ marginLeft: 8 }} />
          <Text style={styles.cardMetaText}>{item.venue}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color="#8888AA" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filter, activeFilter === f && styles.filterActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resultados */}
      {loading ? (
        <ActivityIndicator color="#FF2D7B" style={{ marginTop: 40 }} />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item: any) => item.id}
          renderItem={renderConcert}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={48} color="#333355" />
          <Text style={styles.emptyText}>
            {query.length > 0 ? 'Sin resultados' : 'Busca tu próximo concierto'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D14' },
  title: { color: 'white', fontSize: 28, fontWeight: '800',
           letterSpacing: 2, padding: 16, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center',
               backgroundColor: '#1A1A2E', margin: 16, marginTop: 8,
               borderRadius: 12, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, color: 'white', marginLeft: 8, fontSize: 15 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 7,
            borderRadius: 20, backgroundColor: '#1A1A2E' },
  filterActive: { backgroundColor: '#FF2D7B' },
  filterText: { color: '#8888AA', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: 'white' },
  card: { flexDirection: 'row', backgroundColor: '#1A1A2E',
          borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardImage: { width: 90, height: 90 },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardGenre: { color: '#FF2D7B', fontSize: 10, fontWeight: '700',
               letterSpacing: 1, marginBottom: 4 },
  cardName: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  cardMetaText: { color: '#8888AA', fontSize: 11, marginLeft: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#8888AA', fontSize: 16 },
});
