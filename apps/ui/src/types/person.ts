export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  occupation?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    has_more: boolean;
  }
}

export interface PersonFilters {
  search?: string;
  birth_date?: string;
  death_date?: string;
  page?: number;
  limit?: number;
} 