import { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Rellena todos los campos'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) setError(error.message);
    // Si no hay error, AuthContext detecta la sesión y redirige automáticamente
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo / Header */}
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={48} color="#E4156B" />
        <Text style={styles.appName}>ConcertApp</Text>
        <Text style={styles.subtitle}>Tu próximo concierto te espera</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passContainer}>
          <TextInput
            style={styles.passInput}
            placeholder="••••••••"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#555" />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Iniciar sesión</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>
            ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0D0D14',
                     justifyContent: 'center', padding: 24 },
  header:          { alignItems: 'center', marginBottom: 48 },
  appName:         { color: '#fff', fontSize: 32, fontWeight: '800',
                     marginTop: 12, letterSpacing: 1 },
  subtitle:        { color: '#8888AA', fontSize: 14, marginTop: 6 },
  form:            { gap: 8 },
  label:           { color: '#8888AA', fontSize: 13,
                     fontWeight: '600', marginBottom: 2, marginTop: 8 },
  input:           { backgroundColor: '#1A1A2E', color: '#fff',
                     borderRadius: 12, padding: 14, fontSize: 15 },
  passContainer:   { flexDirection: 'row', alignItems: 'center',
                     backgroundColor: '#1A1A2E', borderRadius: 12,
                     paddingHorizontal: 14 },
  passInput:       { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  error:           { color: '#E4156B', fontSize: 13, marginTop: 4 },
  button:          { backgroundColor: '#E4156B', borderRadius: 14,
                     padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:            { color: '#8888AA', textAlign: 'center', marginTop: 20 },
  linkBold:        { color: '#fff', fontWeight: '700' },
});
