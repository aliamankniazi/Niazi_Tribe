import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

class WebSocketManager {
  private io: SocketIOServer;
  private redis: Redis;
  private connectedUsers: Map<string, Set<string>> = new Map(); // personId -> Set of socketIds
  private userSockets: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: Server) {
    this.redis = new Redis(config.REDIS_URL);
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket server initialized');
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        
        // You would typically fetch the full user object from the database here
        socket.userId = decoded.userId;
        socket.user = decoded;
        
        logger.info(`User ${decoded.userId} connected via WebSocket`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      
      // Store socket mapping
      this.userSockets.set(socket.id, userId);

      // Handle joining family tree rooms
      socket.on('join-tree', (personId: string) => {
        this.joinTreeRoom(socket, personId);
      });

      // Handle leaving family tree rooms
      socket.on('leave-tree', (personId: string) => {
        this.leaveTreeRoom(socket, personId);
      });

      // Handle person editing events
      socket.on('person-edit-start', (data: { personId: string, field?: string }) => {
        this.handlePersonEditStart(socket, data);
      });

      socket.on('person-edit-stop', (data: { personId: string, field?: string }) => {
        this.handlePersonEditStop(socket, data);
      });

      socket.on('person-field-change', (data: { personId: string, field: string, value: any, operation: string }) => {
        this.handlePersonFieldChange(socket, data);
      });

      // Handle real-time person updates
      socket.on('person-update', (data: { personId: string, updates: any }) => {
        this.handlePersonUpdate(socket, data);
      });

      // Handle relationship changes
      socket.on('relationship-change', (data: { type: string, personId1: string, personId2: string, relationshipType: string }) => {
        this.handleRelationshipChange(socket, data);
      });

      // Handle media upload progress
      socket.on('media-upload-progress', (data: { personId: string, progress: number, fileName: string }) => {
        this.handleMediaUploadProgress(socket, data);
      });

      // Handle cursor/selection sharing
      socket.on('cursor-move', (data: { personId: string, x: number, y: number }) => {
        this.handleCursorMove(socket, data);
      });

      // Handle comments/discussions
      socket.on('comment-add', (data: { personId: string, comment: string, parentId?: string }) => {
        this.handleCommentAdd(socket, data);
      });

      // Handle user presence
      socket.on('user-activity', (data: { action: string, personId?: string, metadata?: any }) => {
        this.handleUserActivity(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        userId,
        message: 'Connected to collaborative editing'
      });
    });
  }

  private joinTreeRoom(socket: AuthenticatedSocket, personId: string) {
    const roomName = `tree:${personId}`;
    socket.join(roomName);
    
    // Track connected users for this person/tree
    if (!this.connectedUsers.has(personId)) {
      this.connectedUsers.set(personId, new Set());
    }
    this.connectedUsers.get(personId)!.add(socket.id);

    // Notify others in the room
    socket.to(roomName).emit('user-joined-tree', {
      userId: socket.userId,
      user: socket.user,
      personId,
      timestamp: new Date().toISOString()
    });

    // Send current active users to the joining user
    const activeUsers = this.getActiveUsersInRoom(personId);
    socket.emit('active-users', { personId, users: activeUsers });

    logger.info(`User ${socket.userId} joined tree room for person ${personId}`);
  }

  private leaveTreeRoom(socket: AuthenticatedSocket, personId: string) {
    const roomName = `tree:${personId}`;
    socket.leave(roomName);
    
    // Remove from connected users
    const connectedInRoom = this.connectedUsers.get(personId);
    if (connectedInRoom) {
      connectedInRoom.delete(socket.id);
      if (connectedInRoom.size === 0) {
        this.connectedUsers.delete(personId);
      }
    }

    // Notify others in the room
    socket.to(roomName).emit('user-left-tree', {
      userId: socket.userId,
      personId,
      timestamp: new Date().toISOString()
    });

    logger.info(`User ${socket.userId} left tree room for person ${personId}`);
  }

  private handlePersonEditStart(socket: AuthenticatedSocket, data: { personId: string, field?: string }) {
    const roomName = `tree:${data.personId}`;
    
    // Store edit lock in Redis with expiration
    const lockKey = `edit_lock:${data.personId}:${data.field || 'general'}`;
    this.redis.setex(lockKey, 30, JSON.stringify({
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    }));

    // Broadcast to other users
    socket.to(roomName).emit('person-edit-started', {
      personId: data.personId,
      field: data.field,
      userId: socket.userId,
      user: socket.user,
      timestamp: new Date().toISOString()
    });
  }

  private handlePersonEditStop(socket: AuthenticatedSocket, data: { personId: string, field?: string }) {
    const roomName = `tree:${data.personId}`;
    
    // Remove edit lock from Redis
    const lockKey = `edit_lock:${data.personId}:${data.field || 'general'}`;
    this.redis.del(lockKey);

    // Broadcast to other users
    socket.to(roomName).emit('person-edit-stopped', {
      personId: data.personId,
      field: data.field,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  }

  private handlePersonFieldChange(socket: AuthenticatedSocket, data: { personId: string, field: string, value: any, operation: string }) {
    const roomName = `tree:${data.personId}`;
    
    // Broadcast real-time field changes for collaborative editing
    socket.to(roomName).emit('person-field-changed', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });

    // Store change in Redis for conflict resolution
    const changeKey = `change:${data.personId}:${Date.now()}`;
    this.redis.setex(changeKey, 300, JSON.stringify({
      ...data,
      userId: socket.userId,
      socketId: socket.id
    }));
  }

  private handlePersonUpdate(socket: AuthenticatedSocket, data: { personId: string, updates: any }) {
    const roomName = `tree:${data.personId}`;
    
    // Broadcast person updates to all users viewing this person
    socket.to(roomName).emit('person-updated', {
      personId: data.personId,
      updates: data.updates,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });

    // Also broadcast to broader tree rooms if this affects family tree structure
    if (data.updates.relationships) {
      this.broadcastToTreeRooms(data.personId, 'tree-structure-changed', {
        personId: data.personId,
        changes: data.updates,
        userId: socket.userId
      });
    }
  }

  private handleRelationshipChange(socket: AuthenticatedSocket, data: { type: string, personId1: string, personId2: string, relationshipType: string }) {
    // Broadcast to both person rooms and any broader tree rooms
    const room1 = `tree:${data.personId1}`;
    const room2 = `tree:${data.personId2}`;
    
    const changeData = {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    };

    socket.to(room1).emit('relationship-changed', changeData);
    socket.to(room2).emit('relationship-changed', changeData);
  }

  private handleMediaUploadProgress(socket: AuthenticatedSocket, data: { personId: string, progress: number, fileName: string }) {
    const roomName = `tree:${data.personId}`;
    
    socket.to(roomName).emit('media-upload-progress', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  }

  private handleCursorMove(socket: AuthenticatedSocket, data: { personId: string, x: number, y: number }) {
    const roomName = `tree:${data.personId}`;
    
    // Broadcast cursor position (throttled on client side)
    socket.to(roomName).emit('cursor-moved', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  }

  private handleCommentAdd(socket: AuthenticatedSocket, data: { personId: string, comment: string, parentId?: string }) {
    const roomName = `tree:${data.personId}`;
    
    socket.to(roomName).emit('comment-added', {
      ...data,
      userId: socket.userId,
      user: socket.user,
      timestamp: new Date().toISOString()
    });
  }

  private handleUserActivity(socket: AuthenticatedSocket, data: { action: string, personId?: string, metadata?: any }) {
    if (data.personId) {
      const roomName = `tree:${data.personId}`;
      socket.to(roomName).emit('user-activity', {
        ...data,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    // Clean up all rooms and locks for this socket
    this.connectedUsers.forEach((sockets, personId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        
        // Notify room about user leaving
        const roomName = `tree:${personId}`;
        socket.to(roomName).emit('user-left-tree', {
          userId,
          personId,
          timestamp: new Date().toISOString()
        });

        if (sockets.size === 0) {
          this.connectedUsers.delete(personId);
        }
      }
    });

    // Clean up edit locks for this socket
    this.cleanupEditLocks(socket.id);
    
    // Remove socket mapping
    this.userSockets.delete(socket.id);
    
    logger.info(`User ${userId} disconnected from WebSocket`);
  }

  private getActiveUsersInRoom(personId: string): any[] {
    const sockets = this.connectedUsers.get(personId);
    if (!sockets) return [];

    const users: any[] = [];
    sockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket && socket.user) {
        users.push({
          userId: socket.userId,
          user: socket.user,
          socketId
        });
      }
    });

    return users;
  }

  private broadcastToTreeRooms(personId: string, event: string, data: any) {
    // This could be enhanced to find all related tree rooms
    const roomName = `tree:${personId}`;
    this.io.to(roomName).emit(event, data);
  }

  private async cleanupEditLocks(socketId: string) {
    try {
      const keys = await this.redis.keys('edit_lock:*');
      for (const key of keys) {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const lock = JSON.parse(lockData);
          if (lock.socketId === socketId) {
            await this.redis.del(key);
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning up edit locks:', error);
    }
  }

  // Public methods for external use
  public broadcastToUser(userId: string, event: string, data: any) {
    const userSocketIds = Array.from(this.userSockets.entries())
      .filter(([, uid]) => uid === userId)
      .map(([socketId]) => socketId);

    userSocketIds.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }

  public broadcastToRoom(personId: string, event: string, data: any) {
    const roomName = `tree:${personId}`;
    this.io.to(roomName).emit(event, data);
  }

  public getConnectedUsers(personId: string): any[] {
    return this.getActiveUsersInRoom(personId);
  }

  public close() {
    this.io.close();
    this.redis.disconnect();
  }
}

export default WebSocketManager; 