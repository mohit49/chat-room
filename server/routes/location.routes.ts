import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as locationController from '../controllers/location.controller';

const router = Router();

// Get all countries
router.get('/countries', locationController.getAllCountries);

// Get cities by country
router.get('/cities/:countryCode', locationController.getCitiesByCountry);

// Save user location (adds country/city if they don't exist)
router.post('/save', authenticateToken, locationController.saveUserLocation);

export default router;

