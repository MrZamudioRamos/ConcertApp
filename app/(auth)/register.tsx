import { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Rellena todos los campos'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);
    if (error) setError(error.message);
    // AuthContext detecta la sesión nueva y redirige automáticamente
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0D0D14' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Ionicons name="musical-notes" size={40} color="#E4156B" />
          <Text style={styles.appName}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Empieza a guardar tus conciertos</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />

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
              placeholder="Mínimo 6 caracteres"
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
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Crear cuenta</Text>
            }
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>
              ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header:         { alignItems: 'center', marginBottom: 40 },
  backBtn:        { position: 'absolute', left: 0, top: 0, padding: 4 },
  appName:        { color: '#fff', fontSize: 28, fontWeight: '800',
                    marginTop: 12, letterSpacing: 1 },
  subtitle:       { color: '#8888AA', fontSize: 14, marginTop: 6 },
  form:           { gap: 8 },
  label:          { color: '#8888AA', fontSize: 13,
                    fontWeight: '600', marginBottom: 2, marginTop: 8 },
  input:          { backgroundColor: '#1A1A2E', color: '#fff',
                    borderRadius: 12, padding: 14, fontSize: 15 },
  passContainer:  { flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#1A1A2E', borderRadius: 12,
                    paddingHorizontal: 14 },
  passInput:      { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  error:          { color: '#E4156B', fontSize: 13, marginTop: 4 },
  button:         { backgroundColor: '#E4156B', borderRadius: 14,
                    padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:           { color: '#8888AA', textAlign: 'center', marginTop: 20 },
  linkBold:       { color: '#fff', fontWeight: '700' },
});
