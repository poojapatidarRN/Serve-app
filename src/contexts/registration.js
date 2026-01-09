import React, { createContext, useContext, useState } from 'react';

/* ---------------- Context ---------------- */

const RegistrationContext = createContext(null);

/* ---------------- Provider ---------------- */

export function RegistrationProvider({ children }) {
  const [locationData, setLocationData] = useState({
    district: '',
    tehsil: '',
    pincode: '',
  });

  const [familyHead, setFamilyHead] = useState({
    mukhiyaName: '',
    fatherName: '',
    gotr: '',
    nivashi: '',
    address: '',
    mobileNo: '',
  });

  const [familyMembers, setFamilyMembers] = useState([]);

  const addFamilyMember = member => {
    const newMember = {
      ...member,
      id: Date.now().toString(),
    };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const removeFamilyMember = id => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const updateFamilyMember = (id, updatedMember) => {
    setFamilyMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updatedMember } : m)),
    );
  };

  return (
    <RegistrationContext.Provider
      value={{
        locationData,
        setLocationData,
        familyHead,
        setFamilyHead,
        familyMembers,
        addFamilyMember,
        removeFamilyMember,
        updateFamilyMember,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

/* ---------------- Hook ---------------- */

export function useRegistration() {
  const context = useContext(RegistrationContext);

  if (!context) {
    throw new Error('useRegistration must be used inside RegistrationProvider');
  }

  return context;
}
