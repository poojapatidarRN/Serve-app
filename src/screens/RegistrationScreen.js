import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import FamilyMembersSection from './FamilyMembersSection';
import { back } from '../assets/images';
import { useLocation } from '../contexts/LocationContext';

export default function RegistrationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { district, tehsil, pincode, locationId } = route.params || {};
  const { t, i18n } = useTranslation();

  const [mukhiyaName, setMukhiyaName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gotr, setGotr] = useState('');
  const [nivashi, setNivashi] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const { location } = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });
  }, []);

  /* ---------- VALIDATION ---------- */
  const validateForm = () => {
    if (!mukhiyaName.trim())
      return Alert.alert(t('registration.validationTitle'), t('registration.enterMukhiya'));
    if (!fatherName.trim())
      return Alert.alert(t('registration.validationTitle'), t('registration.enterFather'));
    if (!gotr.trim())
      return Alert.alert(t('registration.validationTitle'), t('registration.enterGotr'));
    if (!nivashi.trim())
      return Alert.alert(t('registration.validationTitle'), t('registration.enterNivashi'));
    if (!address.trim())
      return Alert.alert(t('registration.validationTitle'), t('registration.enterAddress'));
    if (!mobileNo || mobileNo.length !== 10)
      return Alert.alert(t('registration.validationTitle'), t('registration.invalidMobile'));

    return true;
  };

  const insertNewMembers = async familyId => {
    const newMembers = members.filter(m => m.isNew);
    if (!newMembers.length) return;

    const { data, error } = await supabase
      .from('family_members')
      .insert(
        newMembers.map(m => ({
          family_id: familyId,
          name: m.name,
          relation: m.relation,
          age: m.age ? Number(m.age) : null,
          mobile: m.mobile || null,
          nivashi: m.nivashi,
          address: m.address,
        }))
      )
      .select('id');

    if (error) throw error;

    // mark inserted members as saved
    let dbIndex = 0;
    setMembers(prev =>
      prev.map(m => {
        if (!m.isNew) return m;
        const dbRow = data[dbIndex++];
        return {
          ...m,
          db_id: dbRow.id,
          isNew: false,
        };
      })
    );
  };

  const insertFamily = async ({ latitude, longitude }) => {
    const { data, error } = await supabase
      .from('families')
      .insert({
        surveyor_id: user.id,
        location_id: locationId,
        mukhiya_name: mukhiyaName,
        father_name: fatherName,
        gotr,
        nivashi,
        address,
        mobile: mobileNo,
        latitude,
        longitude,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const doSubmit = async () => {
    if (!location) {
      Alert.alert(
        t('registration.locationNotReady'),
        t('registration.locationWait'),
      );
      return;
    }

    try {
      setLoading(true);
      const familyId = await insertFamily({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      await insertNewMembers(familyId);
      ToastAndroid.show(t('registration.savedSuccess'), ToastAndroid.LONG);

      setMukhiyaName('');
      setFatherName('');
      setGotr('');
      setNivashi('');
      setAddress('');
      setMobileNo('');
      setMembers([]);
    } catch {
      Alert.alert(t('registration.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {

    if (!user) {
      ToastAndroid.show(t('registration.notLoggedIn'), ToastAndroid.LONG);
      return;
    }

    if (!validateForm()) return;

    if (members.length === 0) {
      Alert.alert(
        t('registration.confirmTitle'),
        t('registration.noMemberMsg'),
        [
          { text: t('registration.no'), style: 'cancel' },
          { text: t('registration.yes'), onPress: doSubmit },
        ],
      );
    } else {
      doSubmit();
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.id) {
        // 1️⃣ Update DB (active = false)
        await supabase
          .from('users')
          .update({
            active: false,
            last_login: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      // 2️⃣ End auth session
      await supabase.auth.signOut();

      // 3️⃣ Clear local state
      setUser(null);

      // 4️⃣ Reset navigation
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
      ToastAndroid.show(t('registration.logoutSuccess'), ToastAndroid.SHORT);
    } catch {
      ToastAndroid.show(t('registration.logoutFailed'), ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Image source={back} style={styles.backIcon} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {t('registration.familyRegistration')}
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi')
                }
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>
                  {i18n.language === 'hi' ? 'EN' : 'HI'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.actionBtn, styles.logoutBtn]}
              >
                <Text style={styles.actionText}>
                  {t('registration.logout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {district && (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>
                {district}, {tehsil} - {pincode}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t('registration.headDetails')}
            </Text>

            <Input label={t('registration.mukhiyaName')} value={mukhiyaName} onChangeText={setMukhiyaName} />
            <Input label={t('registration.fatherName')} value={fatherName} onChangeText={setFatherName} />
            <Input label={t('registration.gotr')} value={gotr} onChangeText={setGotr} />
            <Input label={t('registration.nivashi')} value={nivashi} onChangeText={setNivashi} />
            <Input label={t('registration.address')} value={address} onChangeText={setAddress} multiline />
            <Input label={t('registration.mobileNo')} value={mobileNo} onChangeText={setMobileNo} keyboardType="number-pad" maxLength={10} />
          </View>

          <FamilyMembersSection
            members={members}
            setMembers={setMembers}
            defaultNivashi={nivashi}
            defaultAddress={address}
            t={t}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitText}>
              {t('registration.submit')}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

/* ---------- INPUT ---------- */
function Input({ label, style, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, style]} />
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  body: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  inputGroup: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  label: { fontWeight: '600' },
  footer: { backgroundColor: '#fff', padding: 16 },
  submitBtn: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  bottomSpace: { height: 120 },

  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { width: 22, height: 22, tintColor: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.9)' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationIcon: { marginRight: 6 },
  locationText: { color: '#E0E7FF', fontSize: 13, fontWeight: '500' },
});
