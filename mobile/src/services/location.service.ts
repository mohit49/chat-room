// Location Service using Expo Location
import * as Location from 'expo-location';
import { ERROR_MESSAGES } from '../constants';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  address: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationCoords> => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Get address from coordinates
    const address = await getAddressFromCoords(
      location.coords.latitude,
      location.coords.longitude
    );

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
    };
  } catch (error: any) {
    console.error('Error getting location:', error);
    throw new Error(error.message || ERROR_MESSAGES.LOCATION_UNAVAILABLE);
  }
};

export const getAddressFromCoords = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return `${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};


