import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function FamilyMembersSection({
  members,
  setMembers,
  t,
  styles,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    relation: '',
    age: '',
    mobile: '',
  });

  const resetForm = () => {
    setForm({ name: '', relation: '', age: '', mobile: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const onSave = () => {
    if (!form.name || !form.relation) return;

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

  const onEdit = member => {
    setForm({
      name: member.name,
      relation: member.relation,
      age: member.age,
      mobile: member.mobile,
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  return (
    <>
      {members.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.memberDetails}</Text>
          {members.map(m => (
            <View key={m.id} style={styles.memberRow}>
              <Text style={styles.memberItem}>
                • {m.name} ({m.relation})
              </Text>
              <TouchableOpacity onPress={() => onEdit(m)}>
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

          <Field
            label={t.memberName}
            value={form.name}
            onChangeText={v => setForm({ ...form, name: v })}
            styles={styles}
          />
          <Field
            label={t.relation}
            value={form.relation}
            onChangeText={v => setForm({ ...form, relation: v })}
            styles={styles}
          />
          <Field
            label={t.age}
            value={form.age}
            keyboardType="number-pad"
            onChangeText={v => setForm({ ...form, age: v })}
            styles={styles}
          />
          <Field
            label={t.mobile}
            value={form.mobile}
            keyboardType="number-pad"
            onChangeText={v => setForm({ ...form, mobile: v })}
            styles={styles}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={{ color: '#fff' }}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

function Field({ label, styles, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} />
    </View>
  );
}
