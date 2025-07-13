import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DocumentMetadata } from '@/types';
import { auth } from '@/lib/firebase';

export abstract class BaseService<T extends { id: string }> {
  protected abstract collectionName: string;
  protected collection: CollectionReference;

  constructor() {
    this.collection = collection(db, this.collectionName);
  }

  protected generateMetadata(): DocumentMetadata {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    const now = new Date();
    return {
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
      version: 1,
    };
  }

  protected updateMetadata(): Partial<DocumentMetadata> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User must be authenticated');

    return {
      updatedAt: new Date(),
      updatedBy: userId,
      version: serverTimestamp(),
    };
  }

  protected docRef(id: string): DocumentReference {
    return doc(this.collection, id);
  }

  protected async getDocumentById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.docRef(id));
    return docSnap.exists() ? this.convertFromFirestore(docSnap.data() as T) : null;
  }

  protected async queryDocuments(constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.collection, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertFromFirestore({ ...doc.data(), id: doc.id } as T));
  }

  protected async createDocument(data: Omit<T, 'id'>): Promise<T> {
    const docRef = doc(this.collection);
    const newDoc = {
      ...data,
      id: docRef.id,
      metadata: this.generateMetadata(),
    } as T;

    await setDoc(docRef, this.convertToFirestore(newDoc));
    return newDoc;
  }

  protected async updateDocument(id: string, data: Partial<T>): Promise<void> {
    const updateData = {
      ...data,
      metadata: this.updateMetadata(),
    };
    await updateDoc(this.docRef(id), this.convertToFirestore(updateData));
  }

  protected async deleteDocument(id: string): Promise<void> {
    await deleteDoc(this.docRef(id));
  }

  protected async batchOperation(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<T>;
  }>): Promise<void> {
    const batch = writeBatch(db);

    operations.forEach(op => {
      switch (op.type) {
        case 'create': {
          const docRef = doc(this.collection);
          const newDoc = {
            ...op.data,
            id: docRef.id,
            metadata: this.generateMetadata(),
          };
          batch.set(docRef, this.convertToFirestore(newDoc));
          break;
        }
        case 'update': {
          if (!op.id) throw new Error('Document ID required for update');
          const updateData = {
            ...op.data,
            metadata: this.updateMetadata(),
          };
          batch.update(this.docRef(op.id), this.convertToFirestore(updateData));
          break;
        }
        case 'delete': {
          if (!op.id) throw new Error('Document ID required for delete');
          batch.delete(this.docRef(op.id));
          break;
        }
      }
    });

    await batch.commit();
  }

  protected convertToFirestore(data: Partial<T>): DocumentData {
    // Convert Date objects to Firestore Timestamps
    return JSON.parse(JSON.stringify(data), (_, value) => {
      if (value instanceof Date) {
        return Timestamp.fromDate(value);
      }
      return value;
    });
  }

  protected convertFromFirestore(data: T): T {
    // Convert Firestore Timestamps to Date objects
    return JSON.parse(JSON.stringify(data), (_, value) => {
      if (value?.seconds !== undefined && value?.nanoseconds !== undefined) {
        return new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
      }
      return value;
    }) as T;
  }
} 