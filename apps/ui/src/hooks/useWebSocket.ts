import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface ActiveUser {
  userId: string;
  user: any;
  socketId: string;
}

interface CollaborativeState {
  activeUsers: ActiveUser[];
  editLocks: { [key: string]: { userId: string; user: any; field?: string } };
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    autoConnect = true, 
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<CollaborativeState>({
    activeUsers: [],
    editLocks: {},
    isConnected: false,
    connectionStatus: 'disconnected'
  });

  const { isAuthenticated } = useAuthStore();
  const { data: session } = useSession();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  // Connection management
  const connect = useCallback(() => {
    if (!isAuthenticated || !session) {
      console.warn('Cannot connect WebSocket: not authenticated');
      return;
    }

    if (socketRef.current?.connected) {
      return; // Already connected
    }

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    const socket = io(process.env.NEXT_PUBLIC_API_URL || '', {
      auth: { token: session.user.id },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        connectionStatus: 'connected' 
      }));
      reconnectAttemptsRef.current = 0;
      toast.success('Connected to collaborative editing');
    });

    socket.on('disconnect', (reason) => {
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        connectionStatus: 'disconnected',
        activeUsers: [],
        editLocks: {}
      }));
      
      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      setState(prev => ({ ...prev, connectionStatus: 'error' }));
      
      if (reconnectAttemptsRef.current < reconnectionAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectionDelay * reconnectAttemptsRef.current);
      } else {
        toast.error('Failed to connect to collaborative editing');
      }
    });

    // Collaborative editing events
    socket.on('active-users', ({ personId, users }: { personId: string; users: ActiveUser[] }) => {
      setState(prev => ({ ...prev, activeUsers: users }));
    });

    socket.on('user-joined-tree', ({ userId, user, personId }: any) => {
      setState(prev => ({
        ...prev,
        activeUsers: [...prev.activeUsers.filter(u => u.userId !== userId), { userId, user, socketId: '' }]
      }));
      toast.success(`${user.firstName || user.username} joined the family tree`);
    });

    socket.on('user-left-tree', ({ userId, personId }: any) => {
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.filter(u => u.userId !== userId)
      }));
    });

    socket.on('person-edit-started', ({ personId, field, userId, user }: any) => {
      const lockKey = `${personId}:${field || 'general'}`;
      setState(prev => ({
        ...prev,
        editLocks: { ...prev.editLocks, [lockKey]: { userId, user, field } }
      }));
      
      if (field) {
        toast(`${user.firstName || user.username} is editing ${field}`, { icon: 'ℹ️', duration: 2000 });
      }
    });

    socket.on('person-edit-stopped', ({ personId, field, userId }: any) => {
      const lockKey = `${personId}:${field || 'general'}`;
      setState(prev => {
        const newLocks = { ...prev.editLocks };
        delete newLocks[lockKey];
        return { ...prev, editLocks: newLocks };
      });
    });

    socket.on('person-field-changed', ({ personId, field, value, operation, userId }: any) => {
      // Handle real-time field changes
      const event = new CustomEvent('collaborative-field-change', {
        detail: { personId, field, value, operation, userId }
      });
      window.dispatchEvent(event);
    });

    socket.on('person-updated', ({ personId, updates, userId }: any) => {
      // Handle person updates
      const event = new CustomEvent('collaborative-person-update', {
        detail: { personId, updates, userId }
      });
      window.dispatchEvent(event);
    });

    socket.on('relationship-changed', ({ type, personId1, personId2, relationshipType, userId }: any) => {
      // Handle relationship changes
      const event = new CustomEvent('collaborative-relationship-change', {
        detail: { type, personId1, personId2, relationshipType, userId }
      });
      window.dispatchEvent(event);
      
      toast(`Family tree structure updated`, { icon: 'ℹ️', duration: 3000 });
    });

    socket.on('media-upload-progress', ({ personId, progress, fileName, userId }: any) => {
      const event = new CustomEvent('collaborative-media-upload', {
        detail: { personId, progress, fileName, userId }
      });
      window.dispatchEvent(event);
    });

    socket.on('cursor-moved', ({ personId, x, y, userId }: any) => {
      const event = new CustomEvent('collaborative-cursor-move', {
        detail: { personId, x, y, userId }
      });
      window.dispatchEvent(event);
    });

    socket.on('comment-added', ({ personId, comment, parentId, userId, user }: any) => {
      const event = new CustomEvent('collaborative-comment-add', {
        detail: { personId, comment, parentId, userId, user }
      });
      window.dispatchEvent(event);
      
      toast.success(`${user.firstName || user.username} added a comment`);
    });

    socket.on('user-activity', ({ action, personId, userId, metadata }: any) => {
      const event = new CustomEvent('collaborative-user-activity', {
        detail: { action, personId, userId, metadata }
      });
      window.dispatchEvent(event);
    });

  }, [isAuthenticated, session, reconnection, reconnectionAttempts, reconnectionDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setState({
      activeUsers: [],
      editLocks: {},
      isConnected: false,
      connectionStatus: 'disconnected'
    });
  }, []);

  // Tree room management
  const joinTreeRoom = useCallback((personId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-tree', personId);
    }
  }, []);

  const leaveTreeRoom = useCallback((personId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-tree', personId);
    }
  }, []);

  // Editing actions
  const startEditing = useCallback((personId: string, field?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('person-edit-start', { personId, field });
    }
  }, []);

  const stopEditing = useCallback((personId: string, field?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('person-edit-stop', { personId, field });
    }
  }, []);

  const broadcastFieldChange = useCallback((personId: string, field: string, value: any, operation: string = 'update') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('person-field-change', { personId, field, value, operation });
    }
  }, []);

  const broadcastPersonUpdate = useCallback((personId: string, updates: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('person-update', { personId, updates });
    }
  }, []);

  const broadcastRelationshipChange = useCallback((type: string, personId1: string, personId2: string, relationshipType: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('relationship-change', { type, personId1, personId2, relationshipType });
    }
  }, []);

  const broadcastMediaUploadProgress = useCallback((personId: string, progress: number, fileName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('media-upload-progress', { personId, progress, fileName });
    }
  }, []);

  const broadcastCursorMove = useCallback((personId: string, x: number, y: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-move', { personId, x, y });
    }
  }, []);

  const addComment = useCallback((personId: string, comment: string, parentId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('comment-add', { personId, comment, parentId });
    }
  }, []);

  const broadcastUserActivity = useCallback((action: string, personId?: string, metadata?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user-activity', { action, personId, metadata });
    }
  }, []);

  // Utility functions
  const isFieldLocked = useCallback((personId: string, field?: string) => {
    const lockKey = `${personId}:${field || 'general'}`;
    return state.editLocks[lockKey] !== undefined;
  }, [state.editLocks]);

  const getFieldLock = useCallback((personId: string, field?: string) => {
    const lockKey = `${personId}:${field || 'general'}`;
    return state.editLocks[lockKey];
  }, [state.editLocks]);

  // Auto-connect on mount if authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && session) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, session, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    ...state,
    
    // Connection management
    connect,
    disconnect,
    
    // Room management
    joinTreeRoom,
    leaveTreeRoom,
    
    // Editing actions
    startEditing,
    stopEditing,
    broadcastFieldChange,
    broadcastPersonUpdate,
    broadcastRelationshipChange,
    broadcastMediaUploadProgress,
    broadcastCursorMove,
    addComment,
    broadcastUserActivity,
    
    // Utility functions
    isFieldLocked,
    getFieldLock,
    
    // Socket reference (for advanced usage)
    socket: socketRef.current
  };
} 