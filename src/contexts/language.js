import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---------------- Translations ---------------- */

const translations = {
  hi: {
    district: 'जिला',
    tehsil: 'तहसील',
    pincode: 'पिनकोड',
    next: 'आगे बढ़ें',
    continue: 'जारी रखें',
    locationDetails: 'स्थान विवरण',
    familyRegistration: 'परिवार पंजीकरण',
    mukhiyaName: 'मुखिया का नाम',
    fatherName: 'पिता का नाम',
    gotr: 'गोत्र',
    nivashi: 'निवासी',
    address: 'वर्तमान पता',
    mobileNo: 'मो.नं.',
    addMember: 'सदस्य जोड़ें',
    memberDetails: 'परिवार के सदस्य',
    submit: 'सबमिट करें',
    memberName: 'सदस्य का नाम',
    fatherHusbandName: 'पिता/पति का नाम',
    relation: 'संबंध',
    age: 'उम्र',
    qualification: 'योग्यता',
    occupation: 'व्यवसाय',
    mobile: 'मो.',
    required: 'आवश्यक',
    locationInfo: 'स्थान की जानकारी',
  },
  en: {
    district: 'District',
    tehsil: 'Tehsil',
    pincode: 'Pincode',
    next: 'Next',
    continue: 'Continue',
    locationDetails: 'Location Details',
    familyRegistration: 'Family Registration',
    mukhiyaName: "Head's Name",
    fatherName: "Father's Name",
    gotr: 'Gotra',
    nivashi: 'Resident',
    address: 'Current Address',
    mobileNo: 'Mobile No.',
    addMember: 'Add Member',
    memberDetails: 'Family Members',
    submit: 'Submit',
    memberName: "Member's Name",
    fatherHusbandName: "Father's/Husband's Name",
    relation: 'Relation',
    age: 'Age',
    qualification: 'Qualification',
    occupation: 'Occupation',
    mobile: 'Mobile',
    required: 'Required',
    locationInfo: 'Location Information',
  },
};

/* ---------------- Context ---------------- */

const LanguageContext = createContext(null);

/* ---------------- Provider ---------------- */

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('hi');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('language').then(stored => {
      if (stored === 'hi' || stored === 'en') {
        setLanguage(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const toggleLanguage = async () => {
    const nextLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
    await AsyncStorage.setItem('language', nextLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        t: translations[language],
        isLoaded,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/* ---------------- Hook ---------------- */

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
