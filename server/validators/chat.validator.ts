import { z } from 'zod';

export const chatValidator = {
  sendMessage: z.object({
    body: z.object({
      roomId: z.string().min(1, 'Room ID is required'),
      message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
      messageType: z.enum(['text', 'image'], {
        errorMap: () => ({ message: 'Message type must be either text or image' })
      }),
      imageUrl: z.string().url('Image URL must be a valid URL').optional()
    })
  })
};
