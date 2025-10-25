import { Request, Response } from 'express';
import { locationService } from '../services/location.service';

export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const countries = await locationService.getAllCountries();
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Error getting countries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get countries'
    });
  }
};

export const getCitiesByCountry = async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        error: 'Country code is required'
      });
    }
    
    const cities = await locationService.getCitiesByCountry(countryCode);
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Error getting cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cities'
    });
  }
};

export const saveUserLocation = async (req: Request, res: Response) => {
  try {
    const { countryName, countryCode, cityName, state } = req.body;
    
    if (!countryName || !countryCode || !cityName) {
      return res.status(400).json({
        success: false,
        error: 'Country name, country code, and city name are required'
      });
    }
    
    await locationService.saveUserLocation(countryName, countryCode, cityName, state);
    
    res.json({
      success: true,
      message: 'Location saved successfully'
    });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save location'
    });
  }
};

