import { auth } from '@/lib/firebase';
import type { Person, VersionMetadata } from '@/types';

export class VersionControlService {
  private generateVersionMetadata(currentVersion?: number): VersionMetadata {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated');

    return {
      version: (currentVersion || 0) + 1,
      lastModified: new Date().toISOString(),
      lastModifiedBy: user.uid,
    };
  }

  public prepareForUpdate(person: Person): Person {
    const newMetadata = this.generateVersionMetadata(person.metadata?.version);
    return {
      ...person,
      metadata: newMetadata,
    };
  }

  public detectConflict(localPerson: Person, remotePerson: Person): boolean {
    // If remote version is ahead of local version, we have a conflict
    return remotePerson.metadata.version > localPerson.metadata.version;
  }

  public async resolveConflict(localPerson: Person, remotePerson: Person): Promise<Person> {
    // Merge strategy: Take the most recent changes while preserving local changes that don't conflict
    const mergedPerson: Person = {
      ...remotePerson,
      metadata: this.generateVersionMetadata(remotePerson.metadata.version),
    };

    // Merge arrays using Set to remove duplicates
    mergedPerson.parents = [...new Set([...localPerson.parents, ...remotePerson.parents])];
    mergedPerson.children = [...new Set([...localPerson.children, ...remotePerson.children])];
    mergedPerson.spouses = [...new Set([...localPerson.spouses, ...remotePerson.spouses])];

    // Merge life events, preferring the most recent ones
    const allEvents = [...localPerson.lifeEvents, ...remotePerson.lifeEvents];
    const uniqueEvents = allEvents.reduce((acc, event) => {
      const existingEvent = acc.find(e => e.id === event.id);
      if (!existingEvent) {
        acc.push(event);
      } else if (new Date(event.metadata.lastModified) > new Date(existingEvent.metadata.lastModified)) {
        acc[acc.indexOf(existingEvent)] = event;
      }
      return acc;
    }, [] as typeof allEvents);

    mergedPerson.lifeEvents = uniqueEvents;

    return mergedPerson;
  }

  public prepareForOffline(person: Person): Person {
    return {
      ...person,
      metadata: {
        ...person.metadata,
        localVersion: person.metadata.version,
      },
    };
  }

  public hasLocalChanges(person: Person): boolean {
    return typeof person.metadata.localVersion === 'number' &&
      person.metadata.localVersion !== person.metadata.version;
  }
} 