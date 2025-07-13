import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { QueueEntry, SyncStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface OfflineQueueDB extends DBSchema {
  queue: {
    key: string;
    value: QueueEntry;
    indexes: {
      'by-status': string;
      'by-timestamp': string;
    };
  };
}

export class OfflineQueueService {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    hasPendingChanges: false,
    pendingCount: 0,
    failedCount: 0,
  };
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.initDB();
    this.setupNetworkListeners();
  }

  private async initDB() {
    this.db = await openDB<OfflineQueueDB>('offline-queue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('queue', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
    await this.updateSyncStatus();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.notifyListeners();
      toast.success('Back online! You can now sync your changes.', {
        icon: '🌐',
        duration: 4000,
      });
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.notifyListeners();
      toast('Working offline. Changes will be synced when you reconnect.', {
        icon: '📴',
        duration: 4000,
      });
    });
  }

  private async updateSyncStatus() {
    if (!this.db) return;

    const pendingEntries = await this.db.getAllFromIndex('queue', 'by-status', 'pending');
    const failedEntries = await this.db.getAllFromIndex('queue', 'by-status', 'failed');

    this.syncStatus = {
      ...this.syncStatus,
      hasPendingChanges: pendingEntries.length > 0 || failedEntries.length > 0,
      pendingCount: pendingEntries.length,
      failedCount: failedEntries.length,
    };

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  public subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    listener(this.syncStatus);
    return () => this.listeners.delete(listener);
  }

  public async enqueue(entry: Omit<QueueEntry, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const queueEntry: QueueEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    await this.db.add('queue', queueEntry);
    await this.updateSyncStatus();
    
    toast(`${entry.metadata.description} queued for sync`, {
      icon: '📝',
      duration: 3000,
    });
    
    return queueEntry.id;
  }

  public async getEntry(id: string): Promise<QueueEntry | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('queue', id);
  }

  public async getAllEntries(): Promise<QueueEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('queue', 'by-timestamp');
  }

  public async getPendingEntries(): Promise<QueueEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('queue', 'by-status', 'pending');
  }

  public async getFailedEntries(): Promise<QueueEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('queue', 'by-status', 'failed');
  }

  public async updateEntry(id: string, updates: Partial<QueueEntry>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const entry = await this.db.get('queue', id);
    if (!entry) throw new Error('Entry not found');

    const updatedEntry = { ...entry, ...updates };
    await this.db.put('queue', updatedEntry);
    await this.updateSyncStatus();
  }

  public async removeEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const entry = await this.getEntry(id);
    await this.db.delete('queue', id);
    await this.updateSyncStatus();
    
    if (entry) {
      toast(`Removed from queue: ${entry.metadata.description}`, {
        icon: '🗑️',
        duration: 3000,
      });
    }
  }

  public async clearQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear('queue');
    await this.updateSyncStatus();
    
    toast.success('Queue cleared successfully', {
      icon: '🧹',
      duration: 3000,
    });
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
} 