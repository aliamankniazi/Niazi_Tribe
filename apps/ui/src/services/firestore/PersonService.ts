import { where, orderBy, limit, query, getDocs } from 'firebase/firestore';
import { BaseService } from './BaseService';
import type { Person } from '@/types';

export class PersonService extends BaseService<Person> {
  protected collectionName = 'persons';

  async createPerson(data: Omit<Person, 'id' | 'metadata'>): Promise<Person> {
    return this.createDocument(data);
  }

  async getPerson(id: string): Promise<Person | null> {
    return this.getDocumentById(id);
  }

  async updatePerson(id: string, data: Partial<Omit<Person, 'id' | 'treeId' | 'metadata'>>): Promise<void> {
    return this.updateDocument(id, data);
  }

  async deletePerson(id: string): Promise<void> {
    return this.deleteDocument(id);
  }

  async getPersonsByTree(treeId: string): Promise<Person[]> {
    return this.queryDocuments([
      where('treeId', '==', treeId),
      orderBy('lastName'),
      orderBy('firstName')
    ]);
  }

  async searchPersons(treeId: string, searchTerm: string): Promise<Person[]> {
    const firstNameResults = await this.queryDocuments([
      where('treeId', '==', treeId),
      where('firstName', '>=', searchTerm),
      where('firstName', '<=', searchTerm + '\uf8ff'),
      limit(5)
    ]);

    const lastNameResults = await this.queryDocuments([
      where('treeId', '==', treeId),
      where('lastName', '>=', searchTerm),
      where('lastName', '<=', searchTerm + '\uf8ff'),
      limit(5)
    ]);

    // Combine and deduplicate results
    const combined = [...firstNameResults, ...lastNameResults];
    return Array.from(new Map(combined.map(item => [item.id, item])).values());
  }

  async getPersonsByBirthYear(treeId: string, year: number): Promise<Person[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.queryDocuments([
      where('treeId', '==', treeId),
      where('birthDate', '>=', startDate),
      where('birthDate', '<=', endDate)
    ]);
  }

  async getPersonsByCustomField(treeId: string, fieldName: string, value: string): Promise<Person[]> {
    return this.queryDocuments([
      where('treeId', '==', treeId),
      where(`customFields.${fieldName}`, '==', value)
    ]);
  }

  async bulkCreatePersons(persons: Array<Omit<Person, 'id' | 'metadata'>>): Promise<void> {
    const operations = persons.map(person => ({
      type: 'create' as const,
      data: person
    }));

    return this.batchOperation(operations);
  }

  async bulkUpdatePersons(updates: Array<{ id: string; data: Partial<Person> }>): Promise<void> {
    const operations = updates.map(update => ({
      type: 'update' as const,
      id: update.id,
      data: update.data
    }));

    return this.batchOperation(operations);
  }

  async bulkDeletePersons(personIds: string[]): Promise<void> {
    const operations = personIds.map(id => ({
      type: 'delete' as const,
      id
    }));

    return this.batchOperation(operations);
  }
} 