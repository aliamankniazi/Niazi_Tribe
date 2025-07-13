import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Person } from '@/types';
import { VersionControlService } from './VersionControlService';
import { OfflineQueueService } from './OfflineQueueService';
import toast from 'react-hot-toast';

const COLLECTION_NAME = 'persons';
const versionControl = new VersionControlService();
const queueService = new OfflineQueueService();

class PersonService {
  async create(person: Omit<Person, 'id' | 'metadata'>): Promise<Person> {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const newPerson: Person = {
      ...person,
      id: docRef.id,
      metadata: versionControl.generateVersionMetadata(),
    };

    if (navigator.onLine) {
      await setDoc(docRef, newPerson);
    } else {
      await queueService.enqueue({
        action: 'create',
        collection: COLLECTION_NAME,
        documentId: docRef.id,
        data: newPerson,
        metadata: {
          entityType: 'person',
          displayName: `${person.name} ${person.lastName || ''}`.trim(),
          description: `Create new person: ${person.name}`,
        },
      });
    }

    return newPerson;
  }

  async update(id: string, data: Partial<Omit<Person, 'id' | 'metadata'>>): Promise<Person> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Get current version from server or cache
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      throw new Error('Document not found');
    }

    const currentPerson = currentDoc.data() as Person;
    
    // Check for conflicts
    if (versionControl.detectConflict(currentPerson, currentPerson)) {
      throw new Error('VERSION_CONFLICT');
    }

    const updatedPerson: Person = {
      ...currentPerson,
      ...data,
      id,
      metadata: versionControl.generateVersionMetadata(currentPerson.metadata.version),
    };

    if (navigator.onLine) {
      await updateDoc(docRef, updatedPerson);
    } else {
      await queueService.enqueue({
        action: 'update',
        collection: COLLECTION_NAME,
        documentId: id,
        data: updatedPerson,
        metadata: {
          entityType: 'person',
          displayName: `${updatedPerson.name} ${updatedPerson.lastName || ''}`.trim(),
          description: `Update person: ${updatedPerson.name}`,
        },
      });
    }

    return updatedPerson;
  }

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Get person data for queue metadata
    const currentDoc = await getDoc(docRef);
    const person = currentDoc.exists() ? currentDoc.data() as Person : null;

    if (navigator.onLine) {
      await deleteDoc(docRef);
    } else {
      await queueService.enqueue({
        action: 'delete',
        collection: COLLECTION_NAME,
        documentId: id,
        metadata: {
          entityType: 'person',
          displayName: person ? `${person.name} ${person.lastName || ''}`.trim() : id,
          description: `Delete person${person ? `: ${person.name}` : ''}`,
        },
      });
    }
  }

  async get(id: string): Promise<Person | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const person = docSnap.data() as Person;
    return versionControl.prepareForOffline(person);
  }

  async getAll(): Promise<Person[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => {
      const person = doc.data() as Person;
      return versionControl.prepareForOffline(person);
    });
  }

  subscribeToUpdates(callback: (persons: Person[]) => void) {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const persons = snapshot.docs.map(doc => {
        const person = doc.data() as Person;
        return versionControl.prepareForOffline(person);
      });
      callback(persons);
    });
  }

  async resolveConflict(id: string, resolution: 'local' | 'remote' | 'merge'): Promise<Person> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(docRef);
    
    if (!currentDoc.exists()) {
      throw new Error('Document not found');
    }

    const remotePerson = currentDoc.data() as Person;
    const localPerson = await this.get(id);

    if (!localPerson) {
      throw new Error('Local person not found');
    }

    let resolvedPerson: Person;

    switch (resolution) {
      case 'local':
        resolvedPerson = {
          ...localPerson,
          metadata: versionControl.generateVersionMetadata(remotePerson.metadata.version),
        };
        break;
      case 'remote':
        resolvedPerson = remotePerson;
        break;
      case 'merge':
        resolvedPerson = await versionControl.resolveConflict(localPerson, remotePerson);
        break;
      default:
        throw new Error('Invalid resolution type');
    }

    if (navigator.onLine) {
      await setDoc(docRef, resolvedPerson);
    } else {
      await queueService.enqueue({
        action: 'update',
        collection: COLLECTION_NAME,
        documentId: id,
        data: resolvedPerson,
        metadata: {
          entityType: 'person',
          displayName: `${resolvedPerson.name} ${resolvedPerson.lastName || ''}`.trim(),
          description: `Resolve conflict for: ${resolvedPerson.name}`,
        },
      });
    }

    return resolvedPerson;
  }

  async enableOfflineMode() {
    await disableNetwork(db);
    toast('Switched to offline mode. Changes will be queued for later.', {
      icon: '🔌',
      duration: 4000,
    });
  }

  async enableOnlineMode() {
    await enableNetwork(db);
    toast.success('Switched to online mode. You can now sync your changes.', {
      icon: '🔌',
      duration: 4000,
    });
  }
}

export const personService = new PersonService(); 