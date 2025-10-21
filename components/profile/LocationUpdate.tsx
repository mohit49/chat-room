'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Eye, EyeOff } from 'lucide-react';
import { Location } from '@/types';

interface LocationUpdateProps {
  location: Location;
  onLocationUpdate: (location: Location) => Promise<void>;
}

interface GeocodeResult {
  area?: string;
  city?: string;
  state?: string;
  fullAddress: string;
}

export default function LocationUpdate({ location, onLocationUpdate }: LocationUpdateProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVisible, setIsVisible] = useState(location.isVisible ?? true);

  // Reverse geocode coordinates to get address details using Google Geocoding API
  const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      throw new Error('Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location details');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(data.error_message || 'Unable to fetch location details');
    }

    // Parse address components
    const result = data.results[0];
    const components = result.address_components;
    
    let area = '';
    let city = '';
    let state = '';

    components.forEach((component: any) => {
      const types = component.types;
      
      // Get area/locality/neighborhood
      if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        area = component.long_name;
      } else if (types.includes('neighborhood') && !area) {
        area = component.long_name;
      }
      
      // Get city
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
      }
      
      // Get state
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
    });

    return {
      area,
      city,
      state,
      fullAddress: result.formatted_address
    };
  };

  const handleUpdateLocation = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Get address details from Google Geocoding API
          const geocodeResult = await reverseGeocode(latitude, longitude);

          const updatedLocation: Location = {
            latitude,
            longitude,
            address: geocodeResult.fullAddress,
            area: geocodeResult.area,
            city: geocodeResult.city,
            state: geocodeResult.state,
            isVisible
          };

          await onLocationUpdate(updatedLocation);
          setSuccess('Location updated successfully!');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
          console.error('Location update error:', err);
          setError(err.message || 'Failed to update location');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get current location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    setIsVisible(checked);
    
    // If location exists, update it with new visibility setting
    if (location.latitude !== 0 && location.longitude !== 0) {
      try {
        setLoading(true);
        setError('');
        await onLocationUpdate({
          ...location,
          isVisible: checked
        });
        setSuccess(`Location ${checked ? 'visible' : 'hidden'} successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to update visibility');
      } finally {
        setLoading(false);
      }
    }
  };

  const hasLocation = location.latitude !== 0 && location.longitude !== 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </CardTitle>
        <CardDescription>
          {hasLocation ? (
            <span className="flex items-center gap-2">
              {location.isVisible ? (
                <Eye className="w-4 h-4 text-green-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-500" />
              )}
              {location.isVisible ? 'Visible to others' : 'Hidden from others'}
            </span>
          ) : (
            'No location set'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasLocation && (
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              {location.city && location.state ? (
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-800">
                    {location.city}, {location.state}
                  </span>
                </div>
              ) : location.city ? (
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-800">{location.city}</span>
                </div>
              ) : location.state ? (
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-800">{location.state}</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-sm text-gray-600">Location available</span>
                </div>
              )}
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <Label htmlFor="location-visibility" className="text-sm font-medium text-blue-900">
                  Show my location to others
                </Label>
                <p className="text-xs text-blue-700 mt-1">
                  When disabled, your location will be stored but not visible anywhere in the app
                </p>
              </div>
              <Switch
                id="location-visibility"
                checked={isVisible}
                onCheckedChange={handleVisibilityToggle}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleUpdateLocation}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {hasLocation ? 'Updating Location...' : 'Getting Location...'}
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              {hasLocation ? 'Update Current Location' : 'Get Current Location'}
            </>
          )}
        </Button>

        {!hasLocation && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Click the button above to automatically detect and save your current location using GPS.
              We use Google Maps to get accurate area, city, and state information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

