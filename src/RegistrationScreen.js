import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

import { back } from './assets/images';

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [memberForm, setMemberForm] = useState({
    name: '',
    relation: '',
    age: '',
    mobile: '',
  });

  const resetForm = () => {
    setMemberForm({ name: '', relation: '', age: '', mobile: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const onSaveMember = () => {
    if (!memberForm.name || !memberForm.relation) return;

    if (editingId) {
      setMembers(prev =>
        prev.map(m => (m.id === editingId ? { ...m, ...memberForm } : m)),
      );
    } else {
      setMembers(prev => [
        ...prev,
        { ...memberForm, id: Date.now().toString() },
      ]);
    }

    resetForm();
  };

  const onEditMember = member => {
    setMemberForm({
      name: member.name,
      relation: member.relation,
      age: member.age,
      mobile: member.mobile,
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const submit = () => {
    if (!mukhiyaName || !fatherName || mobileNo.length !== 10) return;
    Alert.alert(
      language === 'hi' ? 'सफलता' : 'Success',
      language === 'hi'
        ? 'पंजीकरण सफलतापूर्वक सबमिट किया गया'
        : 'Registration submitted successfully',
    );
  };

  const isValid =
    mukhiyaName.length > 0 && fatherName.length > 0 && mobileNo.length === 10;

  return (
    <View style={styles.container}>
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

            <TouchableOpacity
              onPress={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              style={styles.langBtn}
            >
              <Text style={styles.langText}>
                {language === 'hi' ? 'EN' : 'HI'}
              </Text>
            </TouchableOpacity>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body}>
          {/* ---------- HEAD CARD ---------- */}
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

          {members.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t.memberDetails}</Text>
              {members.map(m => (
                <View key={m.id} style={styles.memberRow}>
                  <Text style={styles.memberItem}>
                    • {m.name} ({m.relation})
                  </Text>
                  <TouchableOpacity onPress={() => onEditMember(m)}>
                    <Text style={styles.editText}>{t.edit}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {!showForm ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addBtnText}>+ {t.addMember}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {editingId ? t.editMember : t.addMember}
              </Text>

              <Input
                label={t.memberName}
                value={memberForm.name}
                onChangeText={v => setMemberForm({ ...memberForm, name: v })}
              />
              <Input
                label={t.relation}
                value={memberForm.relation}
                onChangeText={v =>
                  setMemberForm({ ...memberForm, relation: v })
                }
              />
              <Input
                label={t.age}
                value={memberForm.age}
                onChangeText={v => setMemberForm({ ...memberForm, age: v })}
                keyboardType="number-pad"
              />
              <Input
                label={t.mobile}
                value={memberForm.mobile}
                onChangeText={v => setMemberForm({ ...memberForm, mobile: v })}
                keyboardType="number-pad"
              />

              <View style={styles.row}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={onSaveMember}>
                  <Text style={{ color: '#fff' }}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.disabled]}
          disabled={!isValid}
          onPress={submit}
        >
          <Text style={styles.submitText}>{t.submit}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

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
    alignItems: 'center',
    justifyContent: 'space-between',
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
