import { openDB } from 'idb';
import { QueueEntry } from '@/types';
import toast from 'react-hot-toast';

interface ExportData {
  version: string;
  timestamp: string;
  queueEntries: QueueEntry[];
  metadata: {
    totalEntries: number;
    exportedBy?: string;
    description?: string;
  };
}

export class DataExportService {
  private static readonly CURRENT_VERSION = '1.0.0';

  public async exportData(): Promise<Blob> {
    try {
      const db = await openDB('offline-queue', 1);
      const queueEntries = await db.getAll('queue');

      const exportData: ExportData = {
        version: DataExportService.CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        queueEntries,
        metadata: {
          totalEntries: queueEntries.length,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      return blob;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  public async importData(file: File): Promise<void> {
    try {
      const content = await file.text();
      const importData = JSON.parse(content) as ExportData;

      // Validate the import data
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import file format');
      }

      const db = await openDB('offline-queue', 1);
      const tx = db.transaction('queue', 'readwrite');

      // Clear existing data
      await tx.store.clear();

      // Import new data
      for (const entry of importData.queueEntries) {
        await tx.store.add(entry);
      }

      await tx.done;

      toast.success(`Successfully imported ${importData.queueEntries.length} entries`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to import data'
      );
    }
  }

  private validateImportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') return false;

    // Check required fields
    if (!data.version || !data.timestamp || !Array.isArray(data.queueEntries)) {
      return false;
    }

    // Version compatibility check
    const [majorVersion] = data.version.split('.');
    const [currentMajorVersion] = DataExportService.CURRENT_VERSION.split('.');
    if (majorVersion !== currentMajorVersion) {
      throw new Error(`Incompatible version: ${data.version}. Expected version ${currentMajorVersion}.x.x`);
    }

    // Validate queue entries
    for (const entry of data.queueEntries) {
      if (!this.validateQueueEntry(entry)) {
        return false;
      }
    }

    return true;
  }

  private validateQueueEntry(entry: any): entry is QueueEntry {
    return (
      entry &&
      typeof entry === 'object' &&
      typeof entry.id === 'string' &&
      typeof entry.action === 'string' &&
      typeof entry.collection === 'string' &&
      typeof entry.documentId === 'string' &&
      typeof entry.timestamp === 'string' &&
      typeof entry.status === 'string' &&
      typeof entry.retryCount === 'number' &&
      entry.metadata &&
      typeof entry.metadata === 'object' &&
      typeof entry.metadata.entityType === 'string' &&
      typeof entry.metadata.displayName === 'string' &&
      typeof entry.metadata.description === 'string'
    );
  }
} 