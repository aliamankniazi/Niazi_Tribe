// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TREE_MODERATOR = 'tree_moderator',
  STANDARD_USER = 'standard_user'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: EmailNotificationSettings;
  privacySettings: PrivacySettings;
}

export interface EmailNotificationSettings {
  newMessages: boolean;
  treeUpdates: boolean;
  smartMatches: boolean;
  weeklyDigest: boolean;
}

export interface PrivacySettings {
  profileVisibility: PrivacyLevel;
  treeVisibility: PrivacyLevel;
  contactVisibility: PrivacyLevel;
  allowDnaMatching: boolean;
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FAMILY_ONLY = 'family_only',
  CUSTOM = 'custom'
}

// Person Types
export interface Person {
  id: string;
  names: PersonName[];
  gender: Gender;
  birthDate?: LifeEvent;
  deathDate?: LifeEvent;
  lifeEvents: LifeEvent[];
  biography?: string;
  photos: Media[];
  sources: Source[];
  privacy: PrivacyLevel;
  isLiving: boolean;
  customId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonName {
  id: string;
  type: NameType;
  prefix?: string;
  first: string;
  middle?: string;
  last: string;
  suffix?: string;
  nickname?: string;
  isPrimary: boolean;
}

export enum NameType {
  BIRTH = 'birth',
  MARRIED = 'married',
  PROFESSIONAL = 'professional',
  RELIGIOUS = 'religious',
  NICKNAME = 'nickname'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown'
}

export interface LifeEvent {
  id: string;
  type: EventType;
  date?: EventDate;
  place?: Place;
  description?: string;
  sources: Source[];
  media: Media[];
}

export enum EventType {
  BIRTH = 'birth',
  DEATH = 'death',
  MARRIAGE = 'marriage',
  DIVORCE = 'divorce',
  BAPTISM = 'baptism',
  BURIAL = 'burial',
  IMMIGRATION = 'immigration',
  EDUCATION = 'education',
  OCCUPATION = 'occupation',
  MILITARY = 'military',
  CUSTOM = 'custom'
}

export interface EventDate {
  date?: string; // ISO date string
  dateRange?: {
    start: string;
    end: string;
  };
  circa?: boolean;
  accuracy: DateAccuracy;
}

export enum DateAccuracy {
  EXACT = 'exact',
  APPROXIMATE = 'approximate',
  ESTIMATED = 'estimated',
  BEFORE = 'before',
  AFTER = 'after'
}

export interface Place {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  hierarchy: PlaceHierarchy;
}

export interface PlaceHierarchy {
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  address?: string;
}

// Relationship Types
export interface Relationship {
  id: string;
  type: RelationshipType;
  person1Id: string;
  person2Id: string;
  startDate?: EventDate;
  endDate?: EventDate;
  place?: Place;
  sources: Source[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export enum RelationshipType {
  PARENT_CHILD = 'parent_child',
  SPOUSE = 'spouse',
  SIBLING = 'sibling',
  ADOPTION = 'adoption',
  GODPARENT = 'godparent',
  GUARDIAN = 'guardian'
}

// Media Types
export interface Media {
  id: string;
  type: MediaType;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  tags: string[];
  date?: EventDate;
  place?: Place;
  people: string[]; // Person IDs
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

// Source Types
export interface Source {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  publicationDate?: string;
  url?: string;
  repository?: string;
  citation: string;
  reliability: SourceReliability;
  notes?: string;
  media: Media[];
  createdBy: string;
  createdAt: Date;
}

export enum SourceReliability {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  QUESTIONABLE = 'questionable',
  UNRELIABLE = 'unreliable'
}

// DNA Types
export interface DnaProfile {
  id: string;
  personId: string;
  provider: DnaProvider;
  haplotypeY?: string;
  haplotypeM?: string;
  ethnicityEstimate: EthnicityResult[];
  rawDataUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export enum DnaProvider {
  ANCESTRYDNA = 'ancestrydna',
  TWENTY_THREE_AND_ME = '23andme',
  FAMILYTREEDNA = 'familytreedna',
  MYHERITAGE = 'myheritage',
  GEDMATCH = 'gedmatch'
}

export interface EthnicityResult {
  region: string;
  percentage: number;
  confidence: number;
}

export interface DnaMatch {
  id: string;
  person1Id: string;
  person2Id: string;
  sharedCm: number;
  longestSegment: number;
  estimatedRelationship: string;
  confidence: number;
  chromosomeData?: ChromosomeData[];
}

export interface ChromosomeData {
  chromosome: number;
  startPosition: number;
  endPosition: number;
  centimorgans: number;
  snps: number;
}

// Project Types
export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  ownerId: string;
  members: ProjectMember[];
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectType {
  SURNAME_STUDY = 'surname_study',
  GEOGRAPHIC_STUDY = 'geographic_study',
  DNA_PROJECT = 'dna_project',
  HISTORICAL_RESEARCH = 'historical_research',
  GENERAL = 'general'
}

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
}

export enum ProjectRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  CONTRIBUTOR = 'contributor',
  VIEWER = 'viewer'
}

// Search Types
export interface SearchQuery {
  query?: string;
  filters: SearchFilters;
  sort?: SearchSort;
  pagination: PaginationOptions;
}

export interface SearchFilters {
  birthYear?: {
    min?: number;
    max?: number;
  };
  deathYear?: {
    min?: number;
    max?: number;
  };
  gender?: Gender;
  place?: string;
  surname?: string[];
  tags?: string[];
  hasMedia?: boolean;
  hasDna?: boolean;
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// GEDCOM Types
export interface GedcomImport {
  id: string;
  fileName: string;
  fileSize: number;
  status: ImportStatus;
  progress: number;
  results?: ImportResults;
  errors: ImportError[];
  uploadedBy: string;
  uploadedAt: Date;
  completedAt?: Date;
}

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ImportResults {
  personsCreated: number;
  personsUpdated: number;
  relationshipsCreated: number;
  mediaImported: number;
  sourcesCreated: number;
  duplicatesFound: number;
}

export interface ImportError {
  line?: number;
  field?: string;
  message: string;
  severity: 'warning' | 'error';
}

// Smart Matching Types
export interface SmartMatch {
  id: string;
  person1Id: string;
  person2Id: string;
  confidence: number;
  matchReasons: MatchReason[];
  status: MatchStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  MERGED = 'merged'
}

export interface MatchReason {
  type: MatchReasonType;
  confidence: number;
  details: string;
}

export enum MatchReasonType {
  NAME_SIMILARITY = 'name_similarity',
  DATE_MATCH = 'date_match',
  PLACE_MATCH = 'place_match',
  FAMILY_STRUCTURE = 'family_structure',
  DNA_MATCH = 'dna_match',
  SOURCE_MATCH = 'source_match'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
} 