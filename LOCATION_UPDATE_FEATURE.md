# Location Update Feature with Google Maps Integration

## Overview

This feature allows users to automatically update their location (area, city, state) using Google Maps Geocoding API with privacy controls to hide/show their location in the app.

## What's New

### 1. Enhanced Location Data Structure

The location now includes:
- **Latitude & Longitude**: GPS coordinates
- **Address**: Full formatted address
- **Area**: Neighborhood/locality/sublocality
- **City**: City name
- **State**: State/province name
- **Visibility**: Privacy toggle to hide/show location

### 2. Google Maps Integration

- Uses Google Geocoding API to convert GPS coordinates to human-readable addresses
- Automatically extracts area, city, and state information
- High accuracy location detection

### 3. Privacy Control

- Users can hide their location from being displayed anywhere in the app
- Location is still stored in the backend for future features
- Toggle visibility on/off at any time

## Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Geocoding API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Geocoding API"
   - Click "Enable"
4. Create API credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - (Optional but recommended) Restrict the API key:
     - Click on the API key to edit
     - Under "API restrictions", select "Restrict key"
     - Choose "Geocoding API"
     - Under "Website restrictions", add your domains

### Step 2: Configure Environment Variables

Add the Google Maps API key to your environment files:

**For local development (`local.env`):**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

**For production (`.env.production`):**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

> **Important**: Replace `your_actual_google_maps_api_key_here` with your actual API key from Google Cloud Console.

### Step 3: Restart the Application

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Features

### For Users

1. **Update Location Button**
   - Click "Get Current Location" or "Update Current Location"
   - Browser will request location permission (first time only)
   - Location is automatically geocoded to get area, city, state

2. **Location Display**
   - Shows Area, City, State separately
   - Shows full address
   - Shows coordinates for reference

3. **Privacy Toggle**
   - "Show my location to others" switch
   - When OFF: Location is hidden from all users in the app
   - When ON: Location is visible to other users
   - Location is always stored in backend regardless of visibility

4. **Visual Indicators**
   - Eye icon (👁️) when location is visible
   - Eye-off icon when location is hidden
   - Color-coded status indicators

## Technical Implementation

### Frontend Components

**New Component: `LocationUpdate.tsx`**
- Location: `components/profile/LocationUpdate.tsx`
- Handles geolocation API
- Integrates with Google Geocoding API
- Manages privacy toggle
- Beautiful UI with error handling

### Backend Updates

**Updated Files:**
1. `types/index.ts` - Added new location fields
2. `server/database/schemas/user.schema.ts` - Updated location schema
3. `server/services/user.service.ts` - Added support for new fields
4. `server/validators/user.validator.ts` - Added validation for new fields
5. `server/models/user.model.ts` - Updated model to handle new fields

### API Endpoint

**Update Location Endpoint:**
```
PUT /api/user/location
```

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "San Francisco, CA, USA",
  "area": "Downtown",
  "city": "San Francisco",
  "state": "California",
  "isVisible": true
}
```

## Usage Example

### In Profile Page

```typescript
import LocationUpdate from '@/components/profile/LocationUpdate';

<LocationUpdate 
  location={profile.location}
  onLocationUpdate={handleUpdateLocation}
/>
```

## Privacy & Security

### What's Stored

- **In Database**: All location data (coordinates, address, area, city, state, visibility)
- **Visible to Others**: Only when `isVisible` is `true`

### Permissions Required

- Browser geolocation permission
- Users must explicitly grant location access

### Data Protection

- Location visibility can be toggled at any time
- Hidden locations are never shown in:
  - User profiles (when viewed by others)
  - Search results
  - User lists
  - Any public-facing features

## Error Handling

The component handles various error scenarios:

1. **No API Key**: Shows error message prompting to configure API key
2. **Location Permission Denied**: Clear message to enable location access
3. **Geocoding Failure**: Falls back to coordinates if address lookup fails
4. **Network Errors**: Proper error messages for connection issues
5. **Timeout**: 10-second timeout for location requests

## Future Enhancements

Potential features that can leverage this location data:

1. **Nearby Users**: Find users in the same city/area
2. **Location-based Rooms**: Rooms for specific cities/areas
3. **Distance Calculation**: Show distance to other users
4. **Location History**: Track location changes over time
5. **Geofencing**: Location-based notifications

## API Costs

### Google Maps Geocoding API Pricing

- **Free Tier**: $200 credit per month
- **Cost**: $5 per 1,000 requests
- **Free Requests**: ~40,000 requests per month

For a small to medium app, the free tier should be sufficient.

### Cost Optimization Tips

1. Cache geocoded results
2. Don't reverse geocode on every page load
3. Only geocode when user explicitly updates location
4. Set appropriate API key restrictions

## Troubleshooting

### "Google Maps API key not configured" Error

**Solution**: Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your environment file and restart the server.

### Location Permission Denied

**Solution**: Guide users to:
1. Check browser location settings
2. Enable location for your site
3. Try a different browser if issues persist

### Geocoding Returns Wrong Location

**Solution**: 
1. Ensure Geocoding API is enabled in Google Cloud Console
2. Check API key restrictions
3. Verify API key has not exceeded quota

### Location Not Updating

**Solution**:
1. Check browser console for errors
2. Verify API key is correct
3. Check network requests in DevTools
4. Ensure backend is running and accessible

## Testing Checklist

- [ ] API key is configured in environment
- [ ] Browser prompts for location permission
- [ ] Location updates successfully
- [ ] Area, city, state are populated correctly
- [ ] Privacy toggle works correctly
- [ ] Location visibility is respected in UI
- [ ] Error messages display properly
- [ ] Works on both desktop and mobile browsers

## Files Modified

### Frontend
- ✅ `components/profile/LocationUpdate.tsx` (NEW)
- ✅ `app/profile/page.tsx` (UPDATED)
- ✅ `types/index.ts` (UPDATED)

### Backend
- ✅ `server/database/schemas/user.schema.ts` (UPDATED)
- ✅ `server/services/user.service.ts` (UPDATED)
- ✅ `server/validators/user.validator.ts` (UPDATED)
- ✅ `server/models/user.model.ts` (UPDATED)

### Configuration
- ✅ `env.example` (UPDATED)
- ✅ `local.env` (UPDATED)
- ✅ `LOCATION_UPDATE_FEATURE.md` (NEW - this file)

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Verify environment configuration
4. Check Google Cloud Console for API status

---

**Last Updated**: October 21, 2025
**Feature Status**: ✅ Ready for Production

