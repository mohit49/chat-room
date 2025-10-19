import { z } from 'zod';

export const chatValidator = {
  sendMessage: z.object({
    body: z.object({
      roomId: z.string().min(1, 'Room ID is required'),
      message: z.string().max(1000, 'Message must be less than 1000 characters'),
      messageType: z.enum(['text', 'image', 'audio'], {
        errorMap: () => ({ message: 'Message type must be text, image, or audio' })
      }),
      imageUrl: z.union([z.string(), z.undefined(), z.null()]).optional().refine(
        (val) => !val || val === '' || val.startsWith('/uploads/') || val.startsWith('http://') || val.startsWith('https://'),
        { message: 'Image URL must be a valid URL or path' }
      ),
      audioUrl: z.union([z.string(), z.undefined(), z.null()]).optional().refine(
        (val) => !val || val === '' || val.startsWith('/uploads/') || val.startsWith('http://') || val.startsWith('https://'),
        { message: 'Audio URL must be a valid URL or path' }
      )
    }).passthrough() // Allow additional fields that might be sent
  })
};
