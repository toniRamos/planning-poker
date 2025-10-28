export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  connectedAt: Date;
}

export class UserService {
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  addUser(socketId: string, name: string): ConnectedUser {
    const user: ConnectedUser = {
      id: socketId,
      name: name.trim(),
      socketId,
      connectedAt: new Date()
    };
    
    this.connectedUsers.set(socketId, user);
    return user;
  }

  removeUser(socketId: string): ConnectedUser | null {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      this.connectedUsers.delete(socketId);
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
}