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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

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
    memberName: 'सदस्य का नाम',
    relation: 'संबंध',
    age: 'उम्र',
    mobile: 'मोबाइल',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    submit: 'सबमिट करें',
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
    memberName: "Member's Name",
    relation: 'Relation',
    age: 'Age',
    mobile: 'Mobile',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
  },
};

export default function RegistrationScreen() {
  const [language, setLanguage] = useState('hi');
  const t = translations[language];

  /* ---------- HEAD ---------- */
  const [mukhiyaName, setMukhiyaName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gotr, setGotr] = useState('');
  const [nivashi, setNivashi] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');

  /* ---------- MEMBERS ---------- */
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relation: '',
    age: '',
    mobile: '',
  });

  const addMember = () => {
    if (!newMember.name || !newMember.relation) return;
    setMembers([...members, { ...newMember, id: Date.now().toString() }]);
    setNewMember({ name: '', relation: '', age: '', mobile: '' });
    setShowAdd(false);
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
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
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

          {/* ---------- MEMBERS ---------- */}
          {members.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t.memberDetails}</Text>
              {members.map(m => (
                <Text key={m.id} style={styles.memberItem}>
                  • {m.name} ({m.relation})
                </Text>
              ))}
            </View>
          )}

          {!showAdd ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAdd(true)}
            >
              <Text style={styles.addBtnText}>+ {t.addMember}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Input
                label={t.memberName}
                value={newMember.name}
                onChangeText={v => setNewMember({ ...newMember, name: v })}
              />
              <Input
                label={t.relation}
                value={newMember.relation}
                onChangeText={v => setNewMember({ ...newMember, relation: v })}
              />
              <Input
                label={t.age}
                value={newMember.age}
                onChangeText={v => setNewMember({ ...newMember, age: v })}
                keyboardType="number-pad"
              />
              <Input
                label={t.mobile}
                value={newMember.mobile}
                onChangeText={v => setNewMember({ ...newMember, mobile: v })}
                keyboardType="number-pad"
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowAdd(false)}
                >
                  <Text>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addMember}>
                  <Text style={{ color: '#fff' }}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- FOOTER ---------- */}
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

/* ---------- INPUT ---------- */

function Input({ label, style, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, style]} />
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
    fontSize: 22,
    fontWeight: '700',
  },

  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  langText: { color: '#fff', fontWeight: '600' },

  body: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },

  label: { fontWeight: '600', fontSize: 14 },

  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4F46E5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },

  addBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
  },

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

  memberItem: { color: '#374151', fontSize: 14 },
});
