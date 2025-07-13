import { where, orderBy, query, getDocs } from 'firebase/firestore';
import { BaseService } from './BaseService';
import type { Note } from '@/types';

export class NoteService extends BaseService<Note> {
  protected collectionName = 'notes';

  async createNote(data: Omit<Note, 'id' | 'metadata'>): Promise<Note> {
    return this.createDocument(data);
  }

  async getNote(id: string): Promise<Note | null> {
    return this.getDocumentById(id);
  }

  async updateNote(
    id: string,
    data: Partial<Omit<Note, 'id' | 'treeId' | 'personId' | 'metadata'>>
  ): Promise<void> {
    return this.updateDocument(id, data);
  }

  async deleteNote(id: string): Promise<void> {
    return this.deleteDocument(id);
  }

  async getNotesByPerson(personId: string): Promise<Note[]> {
    return this.queryDocuments([
      where('personId', '==', personId),
      orderBy('metadata.createdAt', 'desc')
    ]);
  }

  async getNotesByTree(treeId: string): Promise<Note[]> {
    return this.queryDocuments([
      where('treeId', '==', treeId),
      orderBy('metadata.createdAt', 'desc')
    ]);
  }

  async searchNotesByContent(treeId: string, searchTerm: string): Promise<Note[]> {
    // Note: This is a simple implementation. For better search,
    // consider using Algolia or a similar search service
    return this.queryDocuments([
      where('treeId', '==', treeId),
      where('content', '>=', searchTerm),
      where('content', '<=', searchTerm + '\uf8ff')
    ]);
  }

  async getNotesByTag(treeId: string, tag: string): Promise<Note[]> {
    return this.queryDocuments([
      where('treeId', '==', treeId),
      where('tags', 'array-contains', tag),
      orderBy('metadata.createdAt', 'desc')
    ]);
  }

  async addTagToNote(noteId: string, tag: string): Promise<void> {
    const note = await this.getNote(noteId);
    if (!note) throw new Error('Note not found');

    const tags = new Set([...(note.tags || []), tag]);
    return this.updateDocument(noteId, {
      tags: Array.from(tags)
    });
  }

  async removeTagFromNote(noteId: string, tag: string): Promise<void> {
    const note = await this.getNote(noteId);
    if (!note) throw new Error('Note not found');

    return this.updateDocument(noteId, {
      tags: note.tags?.filter(t => t !== tag) || []
    });
  }

  async bulkCreateNotes(notes: Array<Omit<Note, 'id' | 'metadata'>>): Promise<void> {
    const operations = notes.map(note => ({
      type: 'create' as const,
      data: note
    }));

    return this.batchOperation(operations);
  }

  async bulkDeleteNotes(noteIds: string[]): Promise<void> {
    const operations = noteIds.map(id => ({
      type: 'delete' as const,
      id
    }));

    return this.batchOperation(operations);
  }
} 