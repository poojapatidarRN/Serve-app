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

import { supabase } from '../lib/supabase';

const translations = {
  hi: {
    title: 'स्थान विवरण',
    subtitle: 'कृपया अपनी स्थान जानकारी दर्ज करें',
    district: 'जिला',
    tehsil: 'तहसील',
    pincode: 'पिनकोड',
    next: 'आगे बढ़ें',
  },
  en: {
    title: 'Location Details',
    subtitle: 'Please enter your location information',
    district: 'District',
    tehsil: 'Tehsil',
    pincode: 'Pincode',
    next: 'Next',
  },
};

export default function LocationScreen() {
  const navigation = useNavigation();
  const [language, setLanguage] = useState('hi');
  const t = translations[language];

  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true, // ⛔ block back
    );

    return () => {
      subscription.remove(); // ✅ correct cleanup
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLocationFromDB();
    }, [])
  );


  const isValid =
    district.length > 0 && tehsil.length > 0 && pincode.length === 6;

  const fetchLocationFromDB = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;

      const { data, error } = await supabase
        .from('locations')
        .select('district, tehsil, pincode')
        .eq('surveyor_id', user.id)
        .order('created_at', { ascending: false }) // ✅ pick latest
        .limit(1)                                  // ✅ force single row
        .maybeSingle();                            // ✅ now safe

      if (error) {
        console.log('FETCH LOCATION ERROR 👉', error);
        return;
      }

      if (data) {
        setDistrict(data.district || '');
        setTehsil(data.tehsil || '');
        setPincode(data.pincode || '');
      }
    } catch (e) {
      console.log('FETCH LOCATION EXCEPTION 👉', e);
    }
  };


  const onNext = async () => {
    if (!isValid) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        ToastAndroid.show('User not logged in', ToastAndroid.LONG);
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
          {
            onConflict: 'surveyor_id,district,tehsil,pincode',
          }
        )
        .select()
        .single();

      if (error) throw error;

      // RESET FORM
      setDistrict('');
      setTehsil('');
      setPincode('');

      navigation.navigate('RegistrationScreen', {
        locationId: location.id,
        district: location.district,
        tehsil: location.tehsil,
        pincode: location.pincode,
      });
    } catch (e) {
      console.log('LOCATION UPSERT ERROR 👉', e);
      ToastAndroid.show(
        e?.message || 'Location save failed',
        ToastAndroid.LONG
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <TouchableOpacity
              onPress={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              style={styles.langBtn}
            >
              <Text style={styles.langText}>
                {language === 'hi' ? 'EN' : 'HI'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Input
              label={t.district}
              value={district}
              onChangeText={setDistrict}
            />
            <Input label={t.tehsil} value={tehsil} onChangeText={setTehsil} />
            <Input
              label={t.pincode}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          disabled={!isValid}
          style={[styles.button, !isValid && styles.disabled]}
          onPress={onNext}
        >
          <Text style={styles.buttonText}>{t.next}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <TextInput {...props} style={styles.input} />
    </View>
  );
}

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
