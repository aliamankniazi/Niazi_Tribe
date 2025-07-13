import { where, orderBy, query, getDocs } from 'firebase/firestore';
import { BaseService } from './BaseService';
import type { Event } from '@/types';

export class EventService extends BaseService<Event> {
  protected collectionName = 'events';

  async createEvent(data: Omit<Event, 'id' | 'metadata'>): Promise<Event> {
    return this.createDocument(data);
  }

  async getEvent(id: string): Promise<Event | null> {
    return this.getDocumentById(id);
  }

  async updateEvent(
    id: string,
    data: Partial<Omit<Event, 'id' | 'treeId' | 'personId' | 'metadata'>>
  ): Promise<void> {
    return this.updateDocument(id, data);
  }

  async deleteEvent(id: string): Promise<void> {
    return this.deleteDocument(id);
  }

  async getEventsByPerson(personId: string): Promise<Event[]> {
    return this.queryDocuments([
      where('personId', '==', personId),
      orderBy('date', 'asc')
    ]);
  }

  async getEventsByTree(treeId: string, type?: string): Promise<Event[]> {
    const constraints = [
      where('treeId', '==', treeId),
      orderBy('date', 'asc')
    ];

    if (type) {
      constraints.unshift(where('type', '==', type));
    }

    return this.queryDocuments(constraints);
  }

  async getEventsByDateRange(
    treeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Event[]> {
    return this.queryDocuments([
      where('treeId', '==', treeId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    ]);
  }

  async getEventsByParticipant(participantId: string): Promise<Event[]> {
    return this.queryDocuments([
      where('participants', 'array-contains', participantId),
      orderBy('date', 'asc')
    ]);
  }

  async getEventsByMedia(mediaId: string): Promise<Event[]> {
    return this.queryDocuments([
      where('mediaIds', 'array-contains', mediaId),
      orderBy('date', 'asc')
    ]);
  }

  async bulkCreateEvents(events: Array<Omit<Event, 'id' | 'metadata'>>): Promise<void> {
    const operations = events.map(event => ({
      type: 'create' as const,
      data: event
    }));

    return this.batchOperation(operations);
  }

  async bulkDeleteEvents(eventIds: string[]): Promise<void> {
    const operations = eventIds.map(id => ({
      type: 'delete' as const,
      id
    }));

    return this.batchOperation(operations);
  }

  async addParticipantToEvent(eventId: string, participantId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const participants = new Set([...(event.participants || []), participantId]);
    return this.updateDocument(eventId, {
      participants: Array.from(participants)
    });
  }

  async removeParticipantFromEvent(eventId: string, participantId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    return this.updateDocument(eventId, {
      participants: event.participants?.filter(id => id !== participantId) || []
    });
  }

  async addMediaToEvent(eventId: string, mediaId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const mediaIds = new Set([...(event.mediaIds || []), mediaId]);
    return this.updateDocument(eventId, {
      mediaIds: Array.from(mediaIds)
    });
  }

  async removeMediaFromEvent(eventId: string, mediaId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    return this.updateDocument(eventId, {
      mediaIds: event.mediaIds?.filter(id => id !== mediaId) || []
    });
  }
} 