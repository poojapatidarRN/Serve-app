import { PermissionsAndroid, Platform } from 'react-native';

export const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
            title: 'Location Permission',
            message: 'Location is required to save survey data.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
        }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
};
