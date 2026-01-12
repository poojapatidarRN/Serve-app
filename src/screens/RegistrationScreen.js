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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import FamilyMembersSection from './FamilyMembersSection';
import { back } from '../assets/images';

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
  const { district, tehsil, pincode } = route.params || {};

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const loggedUser = data?.session?.user ?? null;
      setUser(loggedUser);

      if (loggedUser) {
        loadFamilyFromDB(loggedUser.id); // ✅ auto-fill
      }
    });
  }, []);

  const upsertFamily = async userId => {
    const { error } = await supabase.from('families').upsert(
      {
        user_id: userId,
        mukhiya_name: mukhiyaName,
        father_name: fatherName,
        gotr,
        nivashi,
        address,
        mobile: mobileNo,
        district,
        tehsil,
        pincode,
      },
      { onConflict: 'user_id' },
    );

    if (error) throw error;
  };

  const fetchFamilyId = async userId => {
    const { data, error } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new Error('Family not found');
    return data.id;
  };

  const insertNewMembers = async familyId => {
    const newMembers = members.filter(m => m.isNew);
    if (!newMembers.length) return;

    const { data, error } = await supabase
      .from('family_members')
      .insert(
        newMembers.map(m => ({
          family_id: familyId,
          client_id: m.id,
          name: m.name,
          relation: m.relation,
          age: m.age ? Number(m.age) : null,
          mobile: m.mobile || null,
        })),
      )
      .select('id, client_id');

    if (error) throw error;

    setMembers(prev =>
      prev.map(m => {
        const row = data.find(d => d.client_id === m.id);
        return row ? { ...m, db_id: row.id, isNew: false } : m;
      }),
    );
  };

  const updateEditedMembers = async () => {
    const editedMembers = members.filter(m => m.isEdited && m.db_id);

    for (const m of editedMembers) {
      const { error } = await supabase
        .from('family_members')
        .update({
          name: m.name,
          relation: m.relation,
          age: m.age ? Number(m.age) : null,
          mobile: m.mobile || null,
        })
        .eq('id', m.db_id);

      if (error) throw error;
    }

    setMembers(prev => prev.map(m => ({ ...m, isEdited: false })));
  };

  const loadFamilyFromDB = async userId => {
    try {
      // 1️⃣ Load family
      const { data: family, error } = await supabase
        .from('families')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !family) return;

      setMukhiyaName(family.mukhiya_name || '');
      setFatherName(family.father_name || '');
      setGotr(family.gotr || '');
      setNivashi(family.nivashi || '');
      setAddress(family.address || '');
      setMobileNo(family.mobile || '');

      // 2️⃣ Load members
      const { data: membersData } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', family.id);

      if (membersData?.length) {
        setMembers(
          membersData.map(m => ({
            id: m.client_id, // keep client id
            db_id: m.id, // DB id
            name: m.name,
            relation: m.relation,
            age: m.age ? String(m.age) : '',
            mobile: m.mobile || '',
            isNew: false,
            isEdited: false,
          })),
        );
      }
    } catch (e) {
      // silent fail
    }
  };

  const submit = async () => {
    if (!user) {
      ToastAndroid.show('User not logged in', ToastAndroid.LONG);
      return;
    }

    if (!mukhiyaName || !fatherName || mobileNo.length !== 10) return;

    try {
      await upsertFamily(user.id);
      const familyId = await fetchFamilyId(user.id);
      await insertNewMembers(familyId);
      await updateEditedMembers();

      // ✅ RELOAD FROM DB (single source of truth)
      await loadFamilyFromDB(user.id);

      ToastAndroid.show('Data saved successfully', ToastAndroid.LONG);
    } catch (e) {
      ToastAndroid.show(
        e?.message || 'Something went wrong',
        ToastAndroid.LONG,
      );
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

  const isValid =
    mukhiyaName.length > 0 && fatherName.length > 0 && mobileNo.length === 10;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Image source={back} style={styles.backIcon} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{t.familyRegistration}</Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* LANGUAGE */}
              <TouchableOpacity
                onPress={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                style={styles.langBtn}
              >
                <Text style={styles.langText}>
                  {language === 'hi' ? 'EN' : 'HI'}
                </Text>
              </TouchableOpacity>

              {/* LOGOUT */}
              <TouchableOpacity onPress={handleLogout} style={styles.langBtn}>
                <Text style={styles.langText}>Logout</Text>
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

      {/* BODY */}
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
            t={t}
            styles={styles}
          />

          <View style={{ height: 120 }} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.disabled]}
            disabled={false}
            onPress={submit}
          >
            <Text style={styles.submitText}>{t.submit}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { width: 22, height: 22, tintColor: '#fff' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  langText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  locationRow: { flexDirection: 'row', marginTop: 8 },
  locationIcon: { marginRight: 6 },
  locationText: { color: '#E0E7FF', fontSize: 14, fontWeight: '500' },
  body: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  label: { fontWeight: '600', fontSize: 14 },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberItem: { color: '#374151', fontSize: 14 },
  editText: { color: '#4F46E5', fontWeight: '600' },
  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4F46E5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: '#4F46E5', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
