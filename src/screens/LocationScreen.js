import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';

export default function LocationScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [pincode, setPincode] = useState('');

  const [districtError, setDistrictError] = useState('');
  const [tehsilError, setTehsilError] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  /* ---------- BLOCK BACK BUTTON ---------- */
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );
    return () => subscription.remove();
  }, []);

  /* ---------- FETCH EXISTING LOCATION ---------- */
  useFocusEffect(
    useCallback(() => {
      fetchLocationFromDB();
    }, [])
  );

  /* ---------- VALIDATIONS ---------- */
  const validateDistrict = value =>
    !value ? t('location.districtRequired') : '';

  const validateTehsil = value =>
    !value ? t('location.tehsilRequired') : '';

  const validatePincode = value => {
    if (!value) return t('location.pincodeRequired');
    if (!/^[0-9]{6}$/.test(value))
      return t('location.pincodeInvalid');
    return '';
  };

  const isValid =
    !validateDistrict(district) &&
    !validateTehsil(tehsil) &&
    !validatePincode(pincode);

  const fetchLocationFromDB = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data } = await supabase
        .from('locations')
        .select('district, tehsil, pincode')
        .eq('surveyor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDistrict(data.district || '');
        setTehsil(data.tehsil || '');
        setPincode(data.pincode || '');
      }
    } catch { }
  };

  /* ---------- SAVE & NEXT ---------- */
  const onNext = async () => {
    if (!isValid) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        ToastAndroid.show(
          t('location.notLoggedIn'),
          ToastAndroid.LONG
        );
        return;
      }

      const { data: location, error } = await supabase
        .from('locations')
        .upsert(
          {
            surveyor_id: user.id,
            district: district.trim(),
            tehsil: tehsil.trim(),
            pincode: pincode.trim(),
          },
          { onConflict: 'surveyor_id,district,tehsil,pincode' }
        )
        .select()
        .single();

      if (error) throw error;

      navigation.navigate('RegistrationScreen', {
        locationId: location.id,
        district: location.district,
        tehsil: location.tehsil,
        pincode: location.pincode,
      });
    } catch {
      ToastAndroid.show(
        t('location.saveFailed'),
        ToastAndroid.LONG
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              {t('location.title')}
            </Text>

            <TouchableOpacity
              onPress={() =>
                i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')
              }
              style={styles.langBtn}
            >
              <Text style={styles.langText}>
                {i18n.language === 'hi' ? 'EN' : 'HI'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubtitle}>
            {t('location.subtitle')}
          </Text>
        </SafeAreaView>
      </View>

      {/* ---------- BODY ---------- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Input
              label={t('location.district')}
              value={district}
              onChangeText={v => {
                setDistrict(v);
                setDistrictError(validateDistrict(v));
              }}
              onBlur={() =>
                setDistrictError(validateDistrict(district))
              }
              error={districtError}
            />

            <Input
              label={t('location.tehsil')}
              value={tehsil}
              onChangeText={v => {
                setTehsil(v);
                setTehsilError(validateTehsil(v));
              }}
              onBlur={() =>
                setTehsilError(validateTehsil(tehsil))
              }
              error={tehsilError}
            />

            <Input
              label={t('location.pincode')}
              value={pincode}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9]/g, '');
                setPincode(cleaned);
                setPincodeError(validatePincode(cleaned));
              }}
              onBlur={() =>
                setPincodeError(validatePincode(pincode))
              }
              keyboardType="number-pad"
              maxLength={6}
              error={pincodeError}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- FOOTER ---------- */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          disabled={!isValid}
          style={[styles.button, !isValid && styles.disabled]}
          onPress={onNext}
        >
          <Text style={styles.buttonText}>
            {t('location.next')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

/* ---------- INPUT COMPONENT ---------- */

function Input({ label, error, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <TextInput
        {...props}
        style={[styles.input, error && styles.inputError]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  header: {
    backgroundColor: '#4F46E5',
    padding: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },

  headerSubtitle: {
    marginTop: 6,
    color: '#E0E7FF',
  },

  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  langText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  body: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    elevation: 3,
  },

  inputGroup: { gap: 6 },

  label: { fontWeight: '600' },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },

  inputError: {
    borderColor: '#EF4444',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },

  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  disabled: { opacity: 0.5 },

  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
