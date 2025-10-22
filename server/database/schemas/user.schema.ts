import mongoose, { Schema, Document } from 'mongoose';
import { User as UserType, UserProfile, ProfilePicture, Location, OnlineStatus } from '../../../types';

// Mongoose document interface
export interface UserDocument extends Omit<UserType, 'id'>, Document {
  _id: string;
}

// Location schema
const LocationSchema = new Schema<Location>({
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  address: { type: String, default: '' },
  area: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  isVisible: { type: Boolean, default: true }, // Default to visible
}, { _id: false });

// Profile Picture schema
const ProfilePictureSchema = new Schema<ProfilePicture>({
  type: { type: String, enum: ['upload', 'avatar'], required: true },
  url: { type: String },
  avatarStyle: { type: String },
  seed: { type: String },
}, { _id: false });

// Notification Settings schema
const NotificationSettingsSchema = new Schema({
  pushEnabled: { type: Boolean, default: true },  // Enable by default
  emailEnabled: { type: Boolean, default: false },
  directMessages: { type: Boolean, default: true },
  roomMessages: { type: Boolean, default: true },
  follows: { type: Boolean, default: true },
  roomInvites: { type: Boolean, default: true },
}, { _id: false });

// User Profile schema
const UserProfileSchema = new Schema<UserProfile>({
  birthDate: { type: String, default: '' },
  age: { type: Number, default: 0 },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  location: { type: LocationSchema, default: () => ({}) },
  profilePicture: { type: ProfilePictureSchema },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  notificationSettings: { type: NotificationSettingsSchema, default: () => ({}) },
}, { _id: false });

// User schema
const UserSchema = new Schema<UserDocument>(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Index for faster queries
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique non-null values
      trim: true,
      lowercase: true,
      index: true, // Index for faster username lookups
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty/undefined
          return /^[a-z0-9][a-z0-9_\-\.!@#$%^&*()+=]{2,19}$/.test(v);
        },
        message: 'Username must be 3-20 characters, start with letter/number, and contain no spaces'
      }
    },
    profile: {
      type: UserProfileSchema,
      default: () => ({}),
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true, // Index for faster queries
    },
    onlineStatus: {
      type: String,
      enum: ['online', 'away', 'offline'],
      default: 'offline',
      index: true, // Index for faster queries
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'users',
  }
);

// Additional index for sorting (removed duplicates as they're already in schema)
UserSchema.index({ createdAt: -1 }); // For sorting by newest

// Transform _id to id when converting to JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);

