import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// File deletion utility
export const deleteFile = async (fileUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return { success: false, error: 'Invalid file URL' };
    }

    // Convert URL to file path
    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(UPLOADS_DIR, relativePath);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlinkSync(filePath);
      console.log(`🗑️ File deleted: ${filePath}`);
      return { success: true };
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
      return { success: true }; // Consider it success if file doesn't exist
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: 'Failed to delete file' };
  }
};
