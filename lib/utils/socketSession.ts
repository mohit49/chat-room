'use client';

// Socket session management utilities
export class SocketSessionManager {
  private static readonly SESSION_KEY = 'socket_session_id';
  private static readonly USER_SESSION_KEY = 'socket_user_session';

  // Generate or get existing session ID
  static getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    
    return sessionId;
  }

  // Store user session info
  static setUserSession(userId: string, username: string) {
    if (typeof window === 'undefined') return;

    const userSession = {
      userId,
      username,
      loginTime: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    sessionStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(userSession));
  }

  // Get user session info
  static getUserSession(): { userId: string; username: string; loginTime: string; sessionId: string } | null {
    if (typeof window === 'undefined') return null;

    const sessionData = sessionStorage.getItem(this.USER_SESSION_KEY);
    if (!sessionData) return null;

    try {
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error parsing user session:', error);
      return null;
    }
  }

  // Clear user session (on logout)
  static clearUserSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.USER_SESSION_KEY);
  }

  // Check if user session is valid
  static isValidUserSession(currentUserId: string): boolean {
    const session = this.getUserSession();
    return session?.userId === currentUserId;
  }

  // Clear all session data (on browser close)
  static clearAllSessions() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.USER_SESSION_KEY);
  }

  // Check if socket should reconnect with same session
  static shouldReuseSocket(currentUserId: string): boolean {
    const session = this.getUserSession();
    
    // Reuse if same user and session is less than 24 hours old
    if (session && session.userId === currentUserId) {
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      return hoursDiff < 24; // Reuse session for 24 hours
    }
    
    return false;
  }
}
