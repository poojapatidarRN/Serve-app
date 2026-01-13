import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { requestLocationPermission } from '../utils/locationPermission';

const LocationContext = createContext({
    ready: false,
    location: null,
});

export const LocationProvider = ({ children }) => {
    const [ready, setReady] = useState(false);
    const [location, setLocation] = useState(null);
    const watchId = useRef(null);

    useEffect(() => {
        const init = async () => {
            const granted = await requestLocationPermission();
            if (!granted) {
                Alert.alert(
                    'Permission Required',
                    'Location permission is required to use this app.'
                );
                return;
            }

            setReady(true);
            startGPS();
        };

        init();

        return () => stopGPS();
    }, []);

    const startGPS = () => {
        if (watchId.current !== null) return;

        watchId.current = Geolocation.watchPosition(
            pos => {
                const { latitude, longitude } = pos.coords;

                // ✅ Always overwrite with latest value
                setLocation({ latitude, longitude });

                console.log('GPS UPDATE:', latitude, longitude);
            },
            error => {
                console.log('GPS ERROR 👉', error);
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 0,
                interval: 2000,
                fastestInterval: 1000,
            }
        );
    };

    const stopGPS = () => {
        if (watchId.current !== null) {
            Geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    };

    return (
        <LocationContext.Provider value={{ ready, location }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);
