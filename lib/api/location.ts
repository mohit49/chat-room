import { getApiUrl } from '../utils/apiUrl';

const API_URL = getApiUrl();

export interface Country {
  _id: string;
  name: string;
  code: string;
}

export interface City {
  name: string;
  state?: string;
}

export const getCountries = async (): Promise<Country[]> => {
  try {
    const response = await fetch(`${API_URL}/location/countries`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

export const getCitiesByCountry = async (countryCode: string): Promise<City[]> => {
  try {
    const response = await fetch(`${API_URL}/location/cities/${countryCode}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const saveUserLocation = async (
  countryName: string,
  countryCode: string,
  cityName: string,
  state?: string
) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/location/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ countryName, countryCode, cityName, state })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
};

