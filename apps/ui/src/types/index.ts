// Base metadata interface for all documents
export interface DocumentMetadata {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

// Tree collection
export interface Tree {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  ownerId: string;
  metadata: {
    totalMembers: number;
    generations: number;
    lastUpdated: Date;
  };
}

// Person collection
export interface Person {
  id: string;
  treeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: Date;
  birthPlace?: string;
  deathDate?: Date;
  deathPlace?: string;
  occupation?: string;
  education?: string;
  bio?: string;
  photoUrl?: string;
  metadata: DocumentMetadata;
  customFields?: Record<string, string>;
}

// Relationship collection
export interface Relationship {
  id: string;
  treeId: string;
  type: 'parent-child' | 'spouse' | 'adopted';
  from: string; // Person ID
  to: string;   // Person ID
  startDate?: Date; // Marriage date for spouse relationships
  endDate?: Date;  // Divorce/death date for spouse relationships
  metadata: DocumentMetadata;
}

// Tree access collection
export type AccessRole = 'viewer' | 'editor' | 'owner';

export interface TreeAccess {
  id: string;
  treeId: string;
  userId: string;
  role: AccessRole;
  grantedBy: string;
  grantedAt: Date;
}

// Media collection
export interface Media {
  id: string;
  treeId: string;
  personId: string;
  type: 'photo' | 'document' | 'video' | 'audio';
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  metadata: DocumentMetadata;
}

// Event collection
export interface Event {
  id: string;
  treeId: string;
  personId: string;
  type: string; // birth, death, marriage, graduation, etc.
  date: Date;
  place?: string;
  description?: string;
  participants?: string[]; // Array of Person IDs
  mediaIds?: string[]; // Array of Media IDs
  metadata: DocumentMetadata;
}

// Note collection
export interface Note {
  id: string;
  treeId: string;
  personId: string;
  content: string;
  tags?: string[];
  metadata: DocumentMetadata;
}

// Tree invite collection
export interface TreeInvite {
  id: string;
  treeId: string;
  email: string;
  role: AccessRole;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt: Date;
} 