import mongoose from 'mongoose';
import config from '../config';

export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📦 MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(config.database.url, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      console.log(`📍 Database: ${config.database.url.split('@')[1] || config.database.url}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      console.log('⚠️  Falling back to in-memory storage');
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('👋 MongoDB disconnected');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const database = Database.getInstance();


