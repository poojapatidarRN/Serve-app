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
    title: 'नया खाता बनाएँ',
    subtitle: 'सिस्टम में नया उपयोगकर्ता पंजीकृत करें',
    name: 'पूरा नाम',
    mobile: 'मोबाइल नंबर',
    password: 'पासवर्ड',
    passwordHint: 'कम से कम 6 अक्षर',
    signup: 'साइन अप',
    success: 'सफलता',
    successMsg: 'उपयोगकर्ता सफलतापूर्वक पंजीकृत किया गया',
    invalidName: 'नाम केवल अक्षरों में होना चाहिए',
    invalidMobile: 'मान्य 10 अंकों का मोबाइल नंबर दर्ज करें',
    mobileExists: 'यह मोबाइल नंबर पहले से पंजीकृत है',
  },
  en: {
    title: 'Create Account',
    subtitle: 'Register a new user for the system',
    name: 'Full Name',
    mobile: 'Mobile Number',
    password: 'Password',
    passwordHint: 'Minimum 6 characters',
    signup: 'Sign Up',
    success: 'Success',
    successMsg: 'User registered successfully',
    invalidName: 'Name should contain only letters',
    invalidMobile: 'Enter a valid 10-digit mobile number',
    mobileExists: 'Mobile number already registered',
  },
};

export default function SignupScreen() {
  const navigation = useNavigation();
  const [language, setLanguage] = useState('hi');
  const t = translations[language];

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');

  /* ---------- VALIDATIONS ---------- */

  const isNameValid = value => /^[A-Za-z\s]+$/.test(value.trim());
  const isMobileValid = value => /^[0-9]{10}$/.test(value);

  const isValid =
    isNameValid(name) &&
    isMobileValid(mobile) &&
    password.length >= 6 &&
    !nameError &&
    !mobileError;

  /* ---------- SIGNUP ---------- */

  const onSignup = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      const email = `${mobile}@serveapp.com`;

      /* 1️⃣ Auth signup */
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() },
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (!data?.user?.id) {
        Alert.alert('Error', 'User creation failed');
        return;
      }

      /* 2️⃣ Insert into users table */
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: name.trim(),
        mobile,
        role: 'surveyor',
      });

      if (profileError) {
        if (profileError.code === '23505') {
          Alert.alert('Error', t.mobileExists);
        } else {
          Alert.alert('Error', profileError.message);
        }
        return;
      }

      /* 3️⃣ UPDATE LOGIN META (ACTIVE + LAST LOGIN) */
      await supabase.rpc('update_login_meta', {
        uid: data.user.id,
        ip: null,
        location: null,
      });

      Alert.alert(t.success, t.successMsg);
      setName('');
      setMobile('');
      setPassword('');
      navigation.navigate('LocationScreen');
    } catch (err) {
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
        {/* ---------- HEADER ---------- */}
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

        {/* ---------- FORM ---------- */}
        <View style={styles.card}>
          {/* NAME */}
          <Field label={t.name}>
            <TextInput
              value={name}
              onChangeText={value => {
                setName(value);
                if (value && !isNameValid(value)) {
                  setNameError(t.invalidName);
                } else {
                  setNameError('');
                }
              }}
              onBlur={() => {
                if (name && !isNameValid(name)) {
                  setNameError(t.invalidName);
                }
              }}
              placeholder={t.name}
              style={[styles.input, nameError && styles.inputError]}
            />
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </Field>

          {/* MOBILE */}
          <Field label={t.mobile}>
            <TextInput
              value={mobile}
              onChangeText={value => {
                const cleaned = value.replace(/[^0-9]/g, '');
                setMobile(cleaned);

                if (cleaned && !isMobileValid(cleaned)) {
                  setMobileError(t.invalidMobile);
                } else {
                  setMobileError('');
                }
              }}
              onBlur={() => {
                if (mobile && !isMobileValid(mobile)) {
                  setMobileError(t.invalidMobile);
                }
              }}
              placeholder={t.mobile}
              keyboardType="number-pad"
              maxLength={10}
              style={[styles.input, mobileError && styles.inputError]}
            />
            {mobileError ? (
              <Text style={styles.errorText}>{mobileError}</Text>
            ) : null}
          </Field>

          {/* PASSWORD */}
          <Field label={t.password}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t.passwordHint}
              secureTextEntry
              style={styles.input}
            />
          </Field>
        </View>

        {/* ---------- SUBMIT ---------- */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || loading) && styles.disabled]}
          disabled={!isValid || loading}
          onPress={onSignup}
        >
          <Text style={styles.submitText}>
            {loading ? 'Please wait...' : t.signup}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.loginText}>
            {language === 'hi'
              ? 'पहले से खाता है? लॉग इन करें'
              : 'Already have an account? Login'}
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
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
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
