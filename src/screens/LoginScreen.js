import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

/* ---------- TRANSLATIONS ---------- */

const translations = {
  hi: {
    title: 'लॉग इन करें',
    subtitle: 'अपने खाते में प्रवेश करें',
    mobile: 'मोबाइल नंबर',
    password: 'पासवर्ड',
    login: 'लॉग इन',
    invalidMobile: 'मान्य मोबाइल नंबर दर्ज करें',
    success: 'सफलतापूर्वक लॉग इन',
    noAccount: 'खाता नहीं है? साइन अप करें',
  },
  en: {
    title: 'Login',
    subtitle: 'Access your account',
    mobile: 'Mobile Number',
    password: 'Password',
    login: 'Login',
    invalidMobile: 'Enter a valid mobile number',
    success: 'Logged in successfully',
    noAccount: 'Don’t have an account? Sign up',
  },
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [language, setLanguage] = useState('hi');
  const t = translations[language];

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isMobileValid = value => /^[0-9]{10}$/.test(value);
  const isValid = isMobileValid(mobile) && password.length >= 6;

  const onLogin = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      const email = `${mobile}@serveapp.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (!data?.user?.id) {
        Alert.alert('Error', 'Login failed');
        return;
      }

      await supabase.rpc('update_login_meta', {
        uid: data.user.id,
        ip: null,
        location: null,
      });

      Alert.alert(t.success);

      // ✅ Continue flow
      navigation.replace('LocationScreen');
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
          </View>

          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>
              {language === 'hi' ? 'EN' : 'HI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={styles.card}>
          <Field label={t.mobile}>
            <TextInput
              value={mobile}
              onChangeText={v => setMobile(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder={t.mobile}
              style={styles.input}
            />
          </Field>

          <Field label={t.password}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t.password}
              style={styles.input}
            />
          </Field>
        </View>

        {/* LOGIN */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || loading) && styles.disabled]}
          disabled={!isValid || loading}
          onPress={onLogin}
        >
          <Text style={styles.submitText}>
            {loading ? 'Please wait...' : t.login}
          </Text>
        </TouchableOpacity>

        {/* SIGNUP LINK */}
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation.navigate('SignupScreen')}
        >
          <Text style={styles.signupText}>{t.noAccount}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- SMALL COMPONENT ---------- */

function Field({ label, children }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1, padding: 16 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
  },

  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
  },
  langText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#F9FAFB',
  },

  submitBtn: {
    marginTop: 28,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  signupLink: {
    marginTop: 18,
    alignItems: 'center',
  },

  signupText: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  disabled: { opacity: 0.5 },
});
