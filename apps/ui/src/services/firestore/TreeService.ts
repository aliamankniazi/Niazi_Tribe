import { where, orderBy, limit, query, getDocs } from 'firebase/firestore';
import { BaseService } from './BaseService';
import type { Tree, TreeAccess } from '@/types';
import { auth } from '@/lib/firebase';

export class TreeService extends BaseService<Tree> {
  protected collectionName = 'trees';

  async createTree(name: string, description: string): Promise<Tree> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    return this.createDocument({
      name,
      description,
      ownerId: userId,
      isPublic: false,
      metadata: {
        totalMembers: 0,
        generations: 0,
        lastUpdated: new Date(),
      },
    });
  }

  async getTree(id: string): Promise<Tree | null> {
    return this.getDocumentById(id);
  }

  async updateTree(id: string, data: Partial<Omit<Tree, 'id' | 'ownerId'>>): Promise<void> {
    return this.updateDocument(id, data);
  }

  async deleteTree(id: string): Promise<void> {
    return this.deleteDocument(id);
  }

  async getUserTrees(): Promise<Tree[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const accessQuery = query(
      collection(db, 'treeAccess'),
      where('userId', '==', userId)
    );
    const accessDocs = await getDocs(accessQuery);
    const treeIds = accessDocs.docs.map(doc => doc.data().treeId);

    if (treeIds.length === 0) return [];

    return this.queryDocuments([
      where('id', 'in', treeIds),
      orderBy('metadata.lastUpdated', 'desc')
    ]);
  }

  async getPublicTrees(limit = 10): Promise<Tree[]> {
    return this.queryDocuments([
      where('isPublic', '==', true),
      orderBy('metadata.lastUpdated', 'desc'),
      limit(limit)
    ]);
  }

  async searchTrees(searchTerm: string): Promise<Tree[]> {
    // Note: This is a simple implementation. For better search,
    // consider using Algolia or a similar search service
    return this.queryDocuments([
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      limit(10)
    ]);
  }

  async updateTreeMetadata(id: string, updates: Partial<Tree['metadata']>): Promise<void> {
    const tree = await this.getTree(id);
    if (!tree) throw new Error('Tree not found');

    return this.updateDocument(id, {
      metadata: {
        ...tree.metadata,
        ...updates,
        lastUpdated: new Date(),
      },
    });
  }

  async setTreeVisibility(id: string, isPublic: boolean): Promise<void> {
    return this.updateDocument(id, { isPublic });
  }
} 