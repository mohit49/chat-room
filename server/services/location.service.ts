import CountryModel from '../database/schemas/country.schema';

class LocationService {
  // Get all countries
  async getAllCountries() {
    try {
      const countries = await CountryModel.find({}, 'name code')
        .sort({ name: 1 })
        .lean();
      return countries;
    } catch (error) {
      console.error('Error getting countries:', error);
      return [];
    }
  }

  // Get cities by country
  async getCitiesByCountry(countryCode: string) {
    try {
      const country = await CountryModel.findOne({ code: countryCode }, 'cities')
        .lean();
      
      if (!country) return [];
      
      // Return unique cities sorted alphabetically
      const cities = country.cities || [];
      return cities.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting cities:', error);
      return [];
    }
  }

  // Add country if it doesn't exist
  async addCountry(name: string, code: string) {
    try {
      const existing = await CountryModel.findOne({ code });
      if (existing) return existing;

      const country = new CountryModel({
        name,
        code,
        cities: []
      });

      await country.save();
      return country;
    } catch (error) {
      console.error('Error adding country:', error);
      throw error;
    }
  }

  // Add city to country if it doesn't exist
  async addCityToCountry(countryCode: string, cityName: string, state?: string) {
    try {
      const country = await CountryModel.findOne({ code: countryCode });
      
      if (!country) {
        throw new Error('Country not found');
      }

      // Check if city already exists in this country
      const cityExists = country.cities.some(
        city => city.name.toLowerCase() === cityName.toLowerCase() &&
                (!state || city.state?.toLowerCase() === state.toLowerCase())
      );

      if (!cityExists) {
        country.cities.push({ name: cityName, state });
        country.updatedAt = new Date();
        await country.save();
      }

      return country;
    } catch (error) {
      console.error('Error adding city:', error);
      throw error;
    }
  }

  // Save user location (adds country and city if they don't exist)
  async saveUserLocation(countryName: string, countryCode: string, cityName: string, state?: string) {
    try {
      // Ensure country exists
      await this.addCountry(countryName, countryCode);
      
      // Add city to country
      await this.addCityToCountry(countryCode, cityName, state);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving user location:', error);
      throw error;
    }
  }

  // Initialize with common countries and cities (seed data)
  async seedLocations() {
    try {
      const existingCountries = await CountryModel.countDocuments();
      if (existingCountries > 0) {
        console.log('Locations already seeded');
        return;
      }

      const seedData = [
        {
          name: 'India',
          code: 'IN',
          cities: [
            { name: 'Mumbai', state: 'Maharashtra' },
            { name: 'Delhi', state: 'Delhi' },
            { name: 'Bangalore', state: 'Karnataka' },
            { name: 'Hyderabad', state: 'Telangana' },
            { name: 'Chennai', state: 'Tamil Nadu' },
            { name: 'Kolkata', state: 'West Bengal' },
            { name: 'Pune', state: 'Maharashtra' },
            { name: 'Ahmedabad', state: 'Gujarat' },
            { name: 'Jaipur', state: 'Rajasthan' },
            { name: 'Lucknow', state: 'Uttar Pradesh' }
          ]
        },
        {
          name: 'United States',
          code: 'US',
          cities: [
            { name: 'New York', state: 'New York' },
            { name: 'Los Angeles', state: 'California' },
            { name: 'Chicago', state: 'Illinois' },
            { name: 'Houston', state: 'Texas' },
            { name: 'Phoenix', state: 'Arizona' },
            { name: 'Philadelphia', state: 'Pennsylvania' },
            { name: 'San Antonio', state: 'Texas' },
            { name: 'San Diego', state: 'California' },
            { name: 'Dallas', state: 'Texas' },
            { name: 'San Jose', state: 'California' }
          ]
        },
        {
          name: 'United Kingdom',
          code: 'GB',
          cities: [
            { name: 'London', state: 'England' },
            { name: 'Manchester', state: 'England' },
            { name: 'Birmingham', state: 'England' },
            { name: 'Leeds', state: 'England' },
            { name: 'Glasgow', state: 'Scotland' },
            { name: 'Edinburgh', state: 'Scotland' },
            { name: 'Liverpool', state: 'England' },
            { name: 'Bristol', state: 'England' }
          ]
        },
        {
          name: 'Canada',
          code: 'CA',
          cities: [
            { name: 'Toronto', state: 'Ontario' },
            { name: 'Montreal', state: 'Quebec' },
            { name: 'Vancouver', state: 'British Columbia' },
            { name: 'Calgary', state: 'Alberta' },
            { name: 'Edmonton', state: 'Alberta' },
            { name: 'Ottawa', state: 'Ontario' }
          ]
        },
        {
          name: 'Australia',
          code: 'AU',
          cities: [
            { name: 'Sydney', state: 'New South Wales' },
            { name: 'Melbourne', state: 'Victoria' },
            { name: 'Brisbane', state: 'Queensland' },
            { name: 'Perth', state: 'Western Australia' },
            { name: 'Adelaide', state: 'South Australia' }
          ]
        }
      ];

      for (const country of seedData) {
        await CountryModel.create(country);
      }

      console.log('✅ Location data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding locations:', error);
    }
  }
}

export const locationService = new LocationService();

