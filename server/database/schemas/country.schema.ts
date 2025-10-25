import mongoose, { Schema, Document } from 'mongoose';

export interface ICity {
  name: string;
  state?: string;
}

export interface ICountry extends Document {
  name: string;
  code: string; // ISO country code (e.g., 'IN' for India, 'US' for USA)
  cities: ICity[];
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema({
  name: { type: String, required: true },
  state: { type: String } // Optional state/province
});

const countrySchema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  cities: [citySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster lookups
countrySchema.index({ name: 1 });
countrySchema.index({ code: 1 });
countrySchema.index({ 'cities.name': 1 });

const CountryModel = mongoose.model<ICountry>('Country', countrySchema);

export default CountryModel;

