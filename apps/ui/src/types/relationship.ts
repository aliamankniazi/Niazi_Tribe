export interface Relationship {
  id: string;
  person1Id: string;
  person2Id: string;
  type: 'parent' | 'child' | 'spouse' | 'sibling' | 'partner';
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 