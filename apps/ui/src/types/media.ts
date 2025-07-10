export interface Media {
  id: string;
  personId: string;
  type: 'photo' | 'document' | 'video' | 'audio' | 'other';
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  tags?: string[];
  isPrivate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 