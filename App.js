import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppNavigator />
      </LocationProvider>
    </AuthProvider>
  );
}
