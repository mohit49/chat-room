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
        serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000, // Connection timeout
        bufferCommands: false, // Disable mongoose buffering
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 5, // Maintain minimum 5 socket connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
        retryWrites: true, // Retry failed writes
        retryReads: true, // Retry failed reads
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

      mongoose.connection.on('connecting', () => {
        console.log('🔄 MongoDB connecting...');
      });

      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected');
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


