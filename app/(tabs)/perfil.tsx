import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { router } from 'expo-router';

export default function Perfil() {
  const { user, signOut } = useAuth();
  const [concertCount, setConcertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topGenre, setTopGenre] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    const { count } = await supabase
      .from('saved_concerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    setConcertCount(count ?? 0);
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. Se borrarán todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const name = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Usuario';
  const email = user?.email ?? '';
  const initials = name.slice(0, 2).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>PERFIL</Text>

      {/* Avatar + info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
        {memberSince ? (
          <Text style={styles.memberSince}>Miembro desde {memberSince}</Text>
        ) : null}
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator color="#E4156B" style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{concertCount}</Text>
            <Text style={styles.statLabel}>Conciertos{'\n'}guardados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="musical-notes" size={28} color="#E4156B" />
            <Text style={styles.statLabel}>Tu música{'\n'}te espera</Text>
          </View>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/index')}
        >
          <Ionicons name="ticket-outline" size={20} color="#E4156B" />
          <Text style={styles.menuText}>Mis Conciertos</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={20} color="#E4156B" />
          <Text style={styles.menuText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#E4156B" />
          <Text style={styles.menuText}>Cambiar contraseña</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </Pressable>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sesión</Text>

        <Pressable style={styles.menuItem} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#E4156B" />
          <Text style={styles.menuText}>Cerrar sesión</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </Pressable>

        <Pressable style={styles.menuItem} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
          <Text style={[styles.menuText, { color: '#ff4444' }]}>Eliminar cuenta</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </Pressable>
      </View>

      <Text style={styles.version}>ConcertApp v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0D0D14' },
  title:         { color: 'white', fontSize: 28, fontWeight: '800',
                   letterSpacing: 2, padding: 16, paddingBottom: 8 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar:        { width: 80, height: 80, borderRadius: 40,
                   backgroundColor: '#E4156B', justifyContent: 'center',
                   alignItems: 'center', marginBottom: 12 },
  avatarText:    { color: '#fff', fontSize: 28, fontWeight: '800' },
  name:          { color: '#fff', fontSize: 22, fontWeight: '700' },
  email:         { color: '#8888AA', fontSize: 14, marginTop: 4 },
  memberSince:   { color: '#555', fontSize: 12, marginTop: 4 },
  statsRow:      { flexDirection: 'row', marginHorizontal: 24,
                   backgroundColor: '#1A1A2E', borderRadius: 16,
                   padding: 20, alignItems: 'center' },
  statBox:       { flex: 1, alignItems: 'center', gap: 6 },
  statNumber:    { color: '#E4156B', fontSize: 32, fontWeight: '800' },
  statLabel:     { color: '#8888AA', fontSize: 12,
                   textAlign: 'center', lineHeight: 16 },
  statDivider:   { width: 1, height: 50, backgroundColor: '#333' },
  section:       { marginTop: 24, marginHorizontal: 16 },
  sectionTitle:  { color: '#8888AA', fontSize: 12, fontWeight: '700',
                   letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  menuItem:      { flexDirection: 'row', alignItems: 'center',
                   backgroundColor: '#1A1A2E', borderRadius: 12,
                   padding: 16, marginBottom: 8, gap: 12 },
  menuText:      { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  version:       { color: '#333', fontSize: 12, textAlign: 'center',
                   marginTop: 'auto', paddingBottom: 16 },
});
