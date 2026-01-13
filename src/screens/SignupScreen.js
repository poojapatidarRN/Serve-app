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


export default function SignupScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateName = value => {
    if (!value) return t('signup.nameRequired');
    if (!/^[A-Za-z\s]+$/.test(value.trim()))
      return t('signup.invalidName');
    return '';
  };

  const validateMobile = value => {
    if (!value) return t('signup.mobileRequired');
    if (!/^[0-9]{10}$/.test(value))
      return t('signup.invalidMobile');
    return '';
  };

  const validatePassword = value => {
    if (!value) return t('signup.passwordRequired');
    if (value.length < 6) return t('signup.passwordMin');
    return '';
  };

  const isValid =
    !validateName(name) &&
    !validateMobile(mobile) &&
    !validatePassword(password);


  const onSignup = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      const email = `${mobile}@serveapp.com`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() },
        },
      });

      if (error) {
        Alert.alert(t('signup.signupFailed'));
        return;
      }

      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: name.trim(),
        mobile,
        role: 'surveyor',
      });

      if (profileError) {
        if (profileError.code === '23505') {
          Alert.alert('Error', t('signup.mobileExists'));
        } else {
          Alert.alert(t('signup.signupFailed'));
        }
        return;
      }

      /* 3️⃣ UPDATE LOGIN META (ACTIVE + LAST LOGIN) */
      await supabase.rpc('update_login_meta', {
        uid: data.user.id,
        ip: null,
        location: null,
      });

      Alert.alert(t('signup.success'), t('signup.successMsg'));
      setName('');
      setMobile('');
      setPassword('');
      navigation.navigate('LocationScreen');
    } catch (err) {
      Alert.alert(t('signup.somethingWrong'));
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
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('signup.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('signup.subtitle')}
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
          <Field label={t('signup.name')}>
            <TextInput
              value={name}
              onChangeText={v => {
                setName(v);
                setNameError(validateName(v));
              }}
              onBlur={() => setNameError(validateName(name))}
              placeholder={t('signup.name')}
              style={[styles.input, nameError && styles.inputError]}
            />
            {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </Field>

          <Field label={t('signup.mobile')}>
            <TextInput
              value={mobile}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '');
                setMobile(cleaned);
                setMobileError(validateMobile(cleaned));
              }}
              onBlur={() => setMobileError(validateMobile(mobile))}
              placeholder={t('signup.mobile')}
              keyboardType="number-pad"
              maxLength={10}
              style={[styles.input, mobileError && styles.inputError]}
            />
            {!!mobileError && <Text style={styles.errorText}>{mobileError}</Text>}
          </Field>


          <Field label={t('signup.password')}>
            <TextInput
              value={password}
              onChangeText={v => {
                setPassword(v);
                setPasswordError(validatePassword(v));
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              placeholder={t('signup.passwordHint')}
              secureTextEntry
              style={[styles.input, passwordError && styles.inputError]}
            />
            {!!passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </Field>

        </View>

        {/* ---------- SUBMIT ---------- */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || loading) && styles.disabled]}
          disabled={!isValid || loading}
          onPress={onSignup}
        >
          <Text style={styles.submitText}>
            {loading ? t('signup.pleaseWait') : t('signup.signup')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.loginText}>
            {t('signup.alreadyAccount')}
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 15,
  },

  inputError: {
    borderColor: '#EF4444',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
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

  disabled: { opacity: 0.5 },
  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },

  loginText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 15,
  },
});
