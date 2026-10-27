import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createAccount, signIn } from '../../data/services/AuthService';

export const AuthScreen = () => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (isCreatingAccount) {
        await createAccount(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (cause) {
      const code =
        cause && typeof cause === 'object' && 'code' in cause
          ? String(cause.code)
          : null;
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Email atau kata sandi tidak sesuai.'
          : code === 'auth/email-already-in-use'
            ? 'Email sudah terdaftar. Silakan masuk.'
            : cause instanceof Error
              ? cause.message
              : 'Autentikasi gagal.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Smart Water Tank</Text>
        <Text style={styles.subtitle}>
          {isCreatingAccount ? 'Buat akun' : 'Masuk untuk memantau toren'}
        </Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
          onChangeText={setPassword}
          placeholder="Kata sandi (minimal 6 karakter)"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy || !email.trim() || password.length < 6}
          onPress={() => void submit()}
          style={[styles.primaryButton, (busy || !email.trim() || password.length < 6) && styles.disabled]}
        >
          {busy
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.primaryButtonText}>{isCreatingAccount ? 'Buat akun' : 'Masuk'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setIsCreatingAccount((current) => !current);
            setError(null);
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            {isCreatingAccount ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Buat akun'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.help}>
          Akun baru harus ditambahkan sebagai anggota toren oleh administrator sebelum dapat melihat data atau menerima alarm.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    elevation: 3,
  },
  title: { color: '#1E3A8A', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
    color: '#111827',
  },
  error: { color: '#B91C1C', marginBottom: 12, fontSize: 13 },
  primaryButton: {
    backgroundColor: '#0284C7',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 4,
  },
  disabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { alignItems: 'center', padding: 14 },
  secondaryButtonText: { color: '#0369A1', fontWeight: '600' },
  help: { color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
});
