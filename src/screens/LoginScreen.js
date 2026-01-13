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
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';


import { supabase } from '../lib/supabase';


export default function LoginScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateMobile = value => {
    if (!value) return t('login.mobileRequired');
    if (!/^[0-9]{10}$/.test(value)) return t('login.mobileInvalid');
    return '';
  };

  const validatePassword = value => {
    if (!value) return t('login.passwordRequired');
    return '';
  };

  const isValid =
    !validateMobile(mobile) &&
    !validatePassword(password);

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
        Alert.alert(t('login.invalidCredentials'));
        return;
      }

      if (!data?.user?.id) {
        Alert.alert(t('login.loginFailed'));
        return;
      }

      await supabase.rpc('update_login_meta', {
        uid: data.user.id,
        ip: null,
        location: null,
      });

      Alert.alert(t('login.success'));
      navigation.replace('LocationScreen');
    } catch {
      Alert.alert(t('login.somethingWrong'));
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
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('login.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('login.subtitle')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.langBtn}
            onPress={() =>
              i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')
            }
          >
            <Text style={styles.langText}>
              {i18n.language === 'hi' ? 'EN' : 'HI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------- FORM ---------- */}
        <View style={styles.card}>
          <Field label={t('login.mobile')}>
            <TextInput
              value={mobile}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '');
                setMobile(cleaned);
                setMobileError(validateMobile(cleaned));
              }}
              onBlur={() => setMobileError(validateMobile(mobile))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder={t('login.mobile')}
              style={[styles.input, mobileError && styles.inputError]}
            />
            {!!mobileError && <Text style={styles.errorText}>{mobileError}</Text>}
          </Field>

          <Field label={t('login.password')}>
            <TextInput
              value={password}
              onChangeText={v => {
                setPassword(v);
                setPasswordError(validatePassword(v));
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              secureTextEntry
              placeholder={t('login.password')}
              style={[styles.input, passwordError && styles.inputError]}
            />
            {!!passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </Field>
        </View>

        {/* ---------- LOGIN ---------- */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || loading) && styles.disabled]}
          disabled={!isValid || loading}
          onPress={onLogin}
        >
          <Text style={styles.submitText}>
            {loading ? t('login.pleaseWait') : t('login.login')}
          </Text>
        </TouchableOpacity>

        {/* ---------- SIGNUP LINK ---------- */}
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation.navigate('SignupScreen')}
        >
          <Text style={styles.signupText}>
            {t('login.noAccount')}
          </Text>
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
  inputError: {
    borderColor: '#EF4444',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
