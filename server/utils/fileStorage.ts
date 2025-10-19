// File-based storage for persistence
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../../types';
import multer from 'multer';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class FileStorage {
  // Load users from file
  static loadUsers(): Map<string, User> {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        const usersArray = JSON.parse(data);
        
        // Convert array to Map and restore Date objects
        const usersMap = new Map<string, User>();
        usersArray.forEach((user: any) => {
          usersMap.set(user.id, {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          });
        });
        
        console.log(`📂 Loaded ${usersMap.size} users from file storage`);
        return usersMap;
      }
    } catch (error) {
      console.error('Error loading users from file:', error);
    }
    
    console.log('📂 No existing data found, starting fresh');
    return new Map<string, User>();
  }

  // Save users to file
  static saveUsers(users: Map<string, User>): void {
    try {
      // Convert Map to array for JSON serialization
      const usersArray = Array.from(users.values());
      
      // Write to file with pretty printing
      fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(usersArray, null, 2),
        'utf-8'
      );
      
      console.log(`💾 Saved ${usersArray.length} users to file storage`);
    } catch (error) {
      console.error('Error saving users to file:', error);
    }
  }

  // Backup data
  static createBackup(): void {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(DATA_DIR, `users.backup.${timestamp}.json`);
        fs.copyFileSync(USERS_FILE, backupFile);
        console.log(`📦 Backup created: ${backupFile}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }
}

// File upload utility
export const uploadFile = async (file: Express.Multer.File, subfolder: string = 'general'): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Create subfolder if it doesn't exist
    const targetDir = path.join(UPLOADS_DIR, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${randomString}${fileExtension}`;
    
    const filePath = path.join(targetDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Return relative URL
    const relativeUrl = `/uploads/${subfolder}/${fileName}`;
    
    return { success: true, url: relativeUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: 'Failed to upload file' };
  }
};

// Enhanced file upload utility with organized folder structure
export const uploadChatFile = async (
  file: Express.Multer.File, 
  senderId: string, 
  receiverId: string, 
  fileType: 'images' | 'audio'
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Create organized folder structure: direct-messages/senderId-receiverId/date/fileType
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const conversationId = `${senderId}-${receiverId}`;
    const subfolder = path.join('direct-messages', conversationId, today, fileType);
    
    const targetDir = path.join(UPLOADS_DIR, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate unique filename with sender info
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${senderId}_${timestamp}_${randomString}${fileExtension}`;
    
    const filePath = path.join(targetDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Return relative URL
    const relativeUrl = `/uploads/${subfolder}/${fileName}`;
    
    return { success: true, url: relativeUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: 'Failed to upload file' };
  }
};


