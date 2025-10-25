import { Request, Response } from 'express';
import { randomChatService } from '../services/randomChat.service';

export const getAvailableUsers = async (req: Request, res: Response) => {
  try {
    const { gender, country, state, city } = req.query;
    
    const filters: any = {};
    if (gender) filters.gender = gender;
    if (country) filters.country = country;
    if (state) filters.state = state;
    if (city) filters.city = city;

    const users = await randomChatService.getAvailableUsers(filters);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting available users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available users'
    });
  }
};

export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const session = await randomChatService.getActiveSession(userId);
    
    if (!session) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active session'
    });
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;
    
    // Verify user is part of the session
    const session = await randomChatService.getActiveSession(userId);
    if (!session || session.sessionId !== sessionId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to end this session'
      });
    }
    
    await randomChatService.endSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
};

export const getSessionMessages = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;
    
    // Verify user is part of the session
    const session = await randomChatService.getActiveSession(userId);
    if (!session || session.sessionId !== sessionId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view this session'
      });
    }
    
    const messages = await randomChatService.getSessionMessages(sessionId);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting session messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session messages'
    });
  }
};


