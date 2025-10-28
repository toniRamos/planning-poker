export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  sessionId: string;
  connectedAt: Date;
  isSpectator?: boolean;
}

export class UserService {
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private sessionUsers: Map<string, Set<string>> = new Map(); // sessionId -> Set of socketIds

  addUser(socketId: string, name: string, sessionId: string, isSpectator: boolean = false): ConnectedUser {
    const user: ConnectedUser = {
      id: socketId,
      name: name.trim(),
      socketId,
      sessionId,
      connectedAt: new Date(),
      isSpectator
    };
    
    this.connectedUsers.set(socketId, user);
    
    // Add user to session mapping
    if (!this.sessionUsers.has(sessionId)) {
      this.sessionUsers.set(sessionId, new Set());
    }
    this.sessionUsers.get(sessionId)!.add(socketId);
    
    return user;
  }

  removeUser(socketId: string): ConnectedUser | null {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      this.connectedUsers.delete(socketId);
      
      // Remove from session mapping
      const sessionUsers = this.sessionUsers.get(user.sessionId);
      if (sessionUsers) {
        sessionUsers.delete(socketId);
        if (sessionUsers.size === 0) {
          this.sessionUsers.delete(user.sessionId);
        }
      }
      
      return user;
    }
    return null;
  }

  getUser(socketId: string): ConnectedUser | undefined {
    return this.connectedUsers.get(socketId);
  }

  getAllUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  getSessionUsers(sessionId: string): ConnectedUser[] {
    const socketIds = this.sessionUsers.get(sessionId) || new Set();
    const users: ConnectedUser[] = [];
    
    for (const socketId of socketIds) {
      const user = this.connectedUsers.get(socketId);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }

  getSessionUserCount(sessionId: string): number {
    return this.sessionUsers.get(sessionId)?.size || 0;
  }

  getUserCount(): number {
    return this.connectedUsers.size;
  }

  updateUserName(socketId: string, newName: string): ConnectedUser | null {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      user.name = newName.trim();
      this.connectedUsers.set(socketId, user);
      return user;
    }
    return null;
  }

  switchUserMode(socketId: string): ConnectedUser | null {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      user.isSpectator = !user.isSpectator;
      this.connectedUsers.set(socketId, user);
      return user;
    }
    return null;
  }
}