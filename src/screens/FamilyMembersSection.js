import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function FamilyMembersSection({
  members,
  setMembers,
  defaultNivashi,
  defaultAddress,
}) {
  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    relation: '',
    age: '',
    mobile: '',
    nivashi: '',
    address: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      relation: '',
      age: '',
      mobile: '',
      nivashi: '',
      address: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  /* ---------- VALIDATION ---------- */
  const validateMember = () => {
    if (!form.name.trim()) {
      Alert.alert(
        t('familyMember.validationTitle'),
        t('familyMember.memberNameRequired'),
      );
      return false;
    }

    if (!form.relation.trim()) {
      Alert.alert(
        t('familyMember.validationTitle'),
        t('familyMember.relationRequired'),
      );
      return false;
    }

    if (form.mobile && form.mobile.length !== 10) {
      Alert.alert(
        t('familyMember.validationTitle'),
        t('familyMember.mobileInvalid'),
      );
      return false;
    }

    return true;
  };

  /* ---------- SAVE ---------- */
  const onSave = () => {
    if (!validateMember()) return;

    if (editingId) {
      setMembers(prev =>
        prev.map(m =>
          m.id === editingId ? { ...m, ...form, isEdited: true } : m,
        ),
      );
    } else {
      setMembers(prev => [
        ...prev,
        {
          ...form,
          id: Date.now().toString(),
          isNew: true,
          isEdited: false,
        },
      ]);
    }

    resetForm();
  };

  const onAddNew = () => {
    setForm({
      name: '',
      relation: '',
      age: '',
      mobile: '',
      nivashi: defaultNivashi || '',
      address: defaultAddress || '',
    });

    setEditingId(null);
    setShowForm(true);
  };

  const onEdit = member => {
    setForm({
      name: member.name || '',
      relation: member.relation || '',
      age: member.age || '',
      mobile: member.mobile || '',
      nivashi: member.nivashi || defaultNivashi || '',
      address: member.address || defaultAddress || '',
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  return (
    <>
      {/* MEMBER LIST */}
      {members.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('familyMember.memberDetails')}
          </Text>

          {members.map(m => (
            <View key={m.id} style={styles.memberRow}>
              <Text style={styles.memberItem}>
                • {m.name} ({m.relation})
              </Text>

              <TouchableOpacity onPress={() => onEdit(m)}>
                <Text style={styles.editText}>
                  {t('familyMember.edit')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ADD BUTTON */}
      {!showForm ? (
        <TouchableOpacity style={styles.addBtn} onPress={onAddNew}>
          <Text style={styles.addBtnText}>
            + {t('familyMember.addMember')}
          </Text>
        </TouchableOpacity>
      ) : (
        /* FORM */
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingId
              ? t('familyMember.editMember')
              : t('familyMember.addMember')}
          </Text>

          <Field
            label={t('familyMember.memberName')}
            value={form.name}
            onChangeText={v => setForm({ ...form, name: v })}
          />

          <Field
            label={t('familyMember.relation')}
            value={form.relation}
            onChangeText={v => setForm({ ...form, relation: v })}
          />

          <Field
            label={t('familyMember.age')}
            value={form.age}
            keyboardType="number-pad"
            onChangeText={v => setForm({ ...form, age: v })}
          />

          <Field
            label={t('familyMember.nivashi')}
            value={form.nivashi}
            onChangeText={v => setForm({ ...form, nivashi: v })}
          />

          <Field
            label={t('familyMember.address')}
            value={form.address}
            onChangeText={v => setForm({ ...form, address: v })}
            multiline
            style={styles.addressInput}
          />

          <Field
            label={t('familyMember.mobile')}
            value={form.mobile}
            keyboardType="number-pad"
            maxLength={10}
            onChangeText={v => setForm({ ...form, mobile: v })}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text>{t('familyMember.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveText}>
                {t('familyMember.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

/* ---------- FIELD ---------- */
function Field({ label, style, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, style]} />
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
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
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberItem: {
    color: '#374151',
    fontSize: 14,
  },
  editText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
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
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
  addressInput: {
    height: 80,
  },
});
