// Simple in-memory store for user sessions
// In a production environment, you would use a database

interface UserSession {
  devinSessionId: string
  devinSessionUrl: string
  lastInteractionTime: Date
}

class SessionStore {
  private sessions: Map<number, UserSession> = new Map()

  // Store a session for a user
  setSession(userId: number, sessionData: UserSession): void {
    this.sessions.set(userId, sessionData)
  }

  // Get a session for a user
  getSession(userId: number): UserSession | undefined {
    return this.sessions.get(userId)
  }

  // Check if a user has an active session
  hasActiveSession(userId: number): boolean {
    return this.sessions.has(userId)
  }

  // Remove a session for a user
  removeSession(userId: number): boolean {
    return this.sessions.delete(userId)
  }

  // Get all sessions
  getAllSessions(): Map<number, UserSession> {
    return this.sessions
  }
}

// Export a singleton instance
export const sessionStore = new SessionStore()

