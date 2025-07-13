import { where, orderBy, query, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { BaseService } from './BaseService';
import type { Media } from '@/types';

export class MediaService extends BaseService<Media> {
  protected collectionName = 'media';
  private storage = getStorage();

  async uploadMedia(
    file: File,
    treeId: string,
    personId: string,
    metadata: Pick<Media, 'title' | 'description' | 'tags' | 'type'>
  ): Promise<Media> {
    const storageRef = ref(this.storage, `trees/${treeId}/persons/${personId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return this.createDocument({
      treeId,
      personId,
      url,
      ...metadata,
    });
  }

  async getMedia(id: string): Promise<Media | null> {
    return this.getDocumentById(id);
  }

  async updateMedia(
    id: string,
    data: Partial<Pick<Media, 'title' | 'description' | 'tags'>>
  ): Promise<void> {
    return this.updateDocument(id, data);
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await this.getMedia(id);
    if (!media) throw new Error('Media not found');

    // Delete from Storage
    const storageRef = ref(this.storage, media.url);
    await deleteObject(storageRef);

    // Delete from Firestore
    return this.deleteDocument(id);
  }

  async getMediaByPerson(personId: string): Promise<Media[]> {
    return this.queryDocuments([
      where('personId', '==', personId),
      orderBy('metadata.createdAt', 'desc')
    ]);
  }

  async getMediaByTree(treeId: string, type?: Media['type']): Promise<Media[]> {
    const constraints = [
      where('treeId', '==', treeId),
      orderBy('metadata.createdAt', 'desc')
    ];

    if (type) {
      constraints.unshift(where('type', '==', type));
    }

    return this.queryDocuments(constraints);
  }

  async bulkDeleteMedia(mediaIds: string[]): Promise<void> {
    const media = await Promise.all(mediaIds.map(id => this.getMedia(id)));
    const validMedia = media.filter((m): m is Media => m !== null);

    // Delete from Storage
    await Promise.all(
      validMedia.map(m => {
        const storageRef = ref(this.storage, m.url);
        return deleteObject(storageRef);
      })
    );

    // Delete from Firestore
    return this.bulkOperation(
      mediaIds.map(id => ({
        type: 'delete' as const,
        id
      }))
    );
  }
} 