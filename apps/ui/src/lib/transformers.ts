export interface ApiPerson {
  id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  death_date?: string;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  // any other fields from the API
}

export interface AppPerson {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
}

export const transformPerson = (apiPerson: ApiPerson): AppPerson => {
  return {
    id: apiPerson.id,
    name: `${apiPerson.first_name || ''} ${apiPerson.last_name || ''}`.trim(),
    birthDate: apiPerson.birth_date,
    deathDate: apiPerson.death_date,
    gender: apiPerson.gender,
    photoUrl: apiPerson.photoUrl,
  };
}; 