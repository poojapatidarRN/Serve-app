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
import { supabase } from '../lib/supabase';
import FamilyMembersSection from './FamilyMembersSection';
import { back } from '../assets/images';
import { getLiveLocation } from '../utils/locationPermission';
import { useLocation } from '../contexts/LocationContext';


/* ---------- TRANSLATIONS ---------- */

const translations = {
  hi: {
    familyRegistration: 'परिवार पंजीकरण',
    headDetails: 'मुखिया विवरण',
    mukhiyaName: 'मुखिया का नाम',
    fatherName: 'पिता का नाम',
    gotr: 'गोत्र',
    nivashi: 'निवासी',
    address: 'पता',
    mobileNo: 'मोबाइल नंबर',
    memberDetails: 'परिवार के सदस्य',
    addMember: 'सदस्य जोड़ें',
    editMember: 'सदस्य संपादित करें',
    memberName: 'सदस्य का नाम',
    relation: 'संबंध',
    age: 'उम्र',
    mobile: 'मोबाइल',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    submit: 'सबमिट करें',
    edit: 'Edit',
  },
  en: {
    familyRegistration: 'Family Registration',
    headDetails: 'Head Details',
    mukhiyaName: "Head's Name",
    fatherName: "Father's Name",
    gotr: 'Gotra',
    nivashi: 'Resident',
    address: 'Address',
    mobileNo: 'Mobile Number',
    memberDetails: 'Family Members',
    addMember: 'Add Member',
    editMember: 'Edit Member',
    memberName: "Member's Name",
    relation: 'Relation',
    age: 'Age',
    mobile: 'Mobile',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
    edit: 'Edit',
  },
};

export default function RegistrationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { district, tehsil, pincode, locationId } = route.params || {};

  const [language, setLanguage] = useState('hi');
  const t = translations[language];

  const [mukhiyaName, setMukhiyaName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gotr, setGotr] = useState('');
  const [nivashi, setNivashi] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false); // 🔹 loader

  const { location } = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const loggedUser = data?.session?.user ?? null;
      setUser(loggedUser);
    });
  }, []);

  /* ---------- VALIDATION ---------- */

  const validateForm = () => {
    if (!mukhiyaName.trim())
      return Alert.alert('Validation', 'Please enter Mukhiya name');
    if (!fatherName.trim())
      return Alert.alert('Validation', 'Please enter Father name');
    if (!gotr.trim()) return Alert.alert('Validation', 'Please enter Gotra');
    if (!nivashi.trim())
      return Alert.alert('Validation', 'Please enter Nivashi');
    if (!address.trim())
      return Alert.alert('Validation', 'Please enter Address');
    if (!mobileNo || mobileNo.length !== 10)
      return Alert.alert('Validation', 'Please enter valid mobile number');

    return true;
  };





  /* ---------- DB METHODS ---------- */




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



  /* ---------- SUBMIT FLOW ---------- */

  // const insertFamily = async () => {
  //   const { data, error } = await supabase
  //     .from('families')
  //     .insert({
  //       surveyor_id: user.id,
  //       location_id: locationId,
  //       mukhiya_name: mukhiyaName,
  //       father_name: fatherName,
  //       gotr,
  //       nivashi,
  //       address,
  //       mobile: mobileNo,
  //     })
  //     .select()
  //     .single();

  //   if (error) throw error;
  //   return data.id; // familyId
  // };


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
        'Location Not Ready',
        'Please wait a few seconds for GPS to initialize.'
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

      ToastAndroid.show('Family saved successfully', ToastAndroid.LONG);

      // reset
      setMukhiyaName('');
      setFatherName('');
      setGotr('');
      setNivashi('');
      setAddress('');
      setMobileNo('');
      setMembers([]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  // const doSubmit = async () => {
  //   try {
  //     setLoading(true);

  //     const coords = await getLiveLocation(); // ✅ ONLY ONCE

  //     const familyId = await insertFamily(coords);
  //     await insertNewMembers(familyId);

  //     ToastAndroid.show('Family saved successfully', ToastAndroid.LONG);
  //     setMukhiyaName('');
  //     setFatherName('');
  //     setGotr('');
  //     setNivashi('');
  //     setAddress('');
  //     setMobileNo('');
  //     setMembers([]);
  //   } catch (e) {
  //     Alert.alert(
  //       'Location Error',
  //       e.message || 'Unable to get location',
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };




  // const doSubmit = async () => {
  //   try {
  //     setLoading(true);

  //     const familyId = await insertFamily();

  //     await insertNewMembers(familyId);

  //     ToastAndroid.show('Family saved successfully', ToastAndroid.LONG);

  //     // ✅ RESET FOR NEXT FAMILY (SAME LOCATION)
  //     setMukhiyaName('');
  //     setFatherName('');
  //     setGotr('');
  //     setNivashi('');
  //     setAddress('');
  //     setMobileNo('');
  //     setMembers([]);
  //   } catch (e) {
  //     ToastAndroid.show(e.message || 'Error', ToastAndroid.LONG);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const submit = async () => {
    if (!user) {
      ToastAndroid.show('User not logged in', ToastAndroid.LONG);
      return;
    }

    if (!validateForm()) return;

    if (members.length === 0) {
      Alert.alert(
        'Confirmation',
        'No family member added. Do you want to continue?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: doSubmit },
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

      ToastAndroid.show('Logged out successfully', ToastAndroid.SHORT);
    } catch (e) {
      ToastAndroid.show('Logout failed', ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <SafeAreaView>
          {/* TOP ROW */}
          <View style={styles.headerTopRow}>
            {/* BACK */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Image source={back} style={styles.backIcon} />
            </TouchableOpacity>

            {/* TITLE */}
            <Text style={styles.headerTitle}>{t.familyRegistration}</Text>

            {/* ACTIONS */}
            <View style={styles.headerActions}>
              {/* LANGUAGE */}
              <TouchableOpacity
                onPress={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>
                  {language === 'hi' ? 'EN' : 'HI'}
                </Text>
              </TouchableOpacity>

              {/* LOGOUT */}
              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.actionBtn, styles.logoutBtn]}
              >
                <Text style={styles.actionText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LOCATION */}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.headDetails}</Text>

            <Input
              label={t.mukhiyaName}
              value={mukhiyaName}
              onChangeText={setMukhiyaName}
            />
            <Input
              label={t.fatherName}
              value={fatherName}
              onChangeText={setFatherName}
            />
            <Input label={t.gotr} value={gotr} onChangeText={setGotr} />
            <Input
              label={t.nivashi}
              value={nivashi}
              onChangeText={setNivashi}
            />
            <Input
              label={t.address}
              value={address}
              onChangeText={setAddress}
              multiline
              style={{ height: 80 }}
            />
            <Input
              label={t.mobileNo}
              value={mobileNo}
              onChangeText={setMobileNo}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <FamilyMembersSection
            members={members}
            setMembers={setMembers}
            defaultNivashi={nivashi}
            defaultAddress={address}
            t={t}
          />
          <View style={{ height: 120 }} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitText}>{t.submit}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ---------- LOADER ---------- */}
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
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, style]} />
    </View>
  );
}

/* ---------- STYLES (only loader added) ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  body: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
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

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.9)', // subtle red
  },

  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  locationIcon: {
    marginRight: 6,
  },

  locationText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '500',
  },
});
