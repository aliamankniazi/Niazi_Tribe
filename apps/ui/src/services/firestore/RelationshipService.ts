import { where, query, getDocs } from 'firebase/firestore';
import { BaseService } from './BaseService';
import type { Relationship } from '@/types';

export class RelationshipService extends BaseService<Relationship> {
  protected collectionName = 'relationships';

  async createRelationship(data: Omit<Relationship, 'id' | 'metadata'>): Promise<Relationship> {
    return this.createDocument(data);
  }

  async getRelationship(id: string): Promise<Relationship | null> {
    return this.getDocumentById(id);
  }

  async updateRelationship(id: string, data: Partial<Omit<Relationship, 'id' | 'treeId' | 'from' | 'to' | 'metadata'>>): Promise<void> {
    return this.updateDocument(id, data);
  }

  async deleteRelationship(id: string): Promise<void> {
    return this.deleteDocument(id);
  }

  async getRelationshipsByTree(treeId: string): Promise<Relationship[]> {
    return this.queryDocuments([where('treeId', '==', treeId)]);
  }

  async getRelationshipsByPerson(personId: string): Promise<Relationship[]> {
    const asFrom = await this.queryDocuments([where('from', '==', personId)]);
    const asTo = await this.queryDocuments([where('to', '==', personId)]);
    return [...asFrom, ...asTo];
  }

  async getParentChildRelationships(personId: string): Promise<Relationship[]> {
    const asParent = await this.queryDocuments([
      where('from', '==', personId),
      where('type', '==', 'parent-child')
    ]);
    
    const asChild = await this.queryDocuments([
      where('to', '==', personId),
      where('type', '==', 'parent-child')
    ]);

    return [...asParent, ...asChild];
  }

  async getSpouseRelationships(personId: string): Promise<Relationship[]> {
    const asSpouse1 = await this.queryDocuments([
      where('from', '==', personId),
      where('type', '==', 'spouse')
    ]);
    
    const asSpouse2 = await this.queryDocuments([
      where('to', '==', personId),
      where('type', '==', 'spouse')
    ]);

    return [...asSpouse1, ...asSpouse2];
  }

  async getAdoptiveRelationships(personId: string): Promise<Relationship[]> {
    const asAdoptiveParent = await this.queryDocuments([
      where('from', '==', personId),
      where('type', '==', 'adopted')
    ]);
    
    const asAdoptedChild = await this.queryDocuments([
      where('to', '==', personId),
      where('type', '==', 'adopted')
    ]);

    return [...asAdoptiveParent, ...asAdoptedChild];
  }

  async bulkCreateRelationships(relationships: Array<Omit<Relationship, 'id' | 'metadata'>>): Promise<void> {
    const operations = relationships.map(relationship => ({
      type: 'create' as const,
      data: relationship
    }));

    return this.batchOperation(operations);
  }

  async bulkDeleteRelationships(relationshipIds: string[]): Promise<void> {
    const operations = relationshipIds.map(id => ({
      type: 'delete' as const,
      id
    }));

    return this.batchOperation(operations);
  }

  async deletePersonRelationships(personId: string): Promise<void> {
    const relationships = await this.getRelationshipsByPerson(personId);
    return this.bulkDeleteRelationships(relationships.map(r => r.id));
  }
} 