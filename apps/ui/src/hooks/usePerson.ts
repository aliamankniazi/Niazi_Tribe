import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PersonService } from '@/services/firestore';
import type { Person } from '@/types';

const personService = new PersonService();

export function usePerson(personId: string) {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch person data
  const {
    data: person,
    isLoading,
    error
  } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => personService.getPerson(personId),
    enabled: !!personId
  });

  // Set up real-time listener
  useEffect(() => {
    if (!personId || !isRealtime) return;

    const unsubscribe = onSnapshot(
      doc(db, 'persons', personId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { ...snapshot.data(), id: snapshot.id } as Person;
          queryClient.setQueryData(['person', personId], data);
        } else {
          queryClient.setQueryData(['person', personId], null);
        }
      },
      (error) => {
        console.error('Person subscription error:', error);
        setIsRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [personId, isRealtime, queryClient]);

  // Update person mutation
  const updatePerson = useMutation({
    mutationFn: (data: Partial<Omit<Person, 'id' | 'treeId' | 'metadata'>>) =>
      personService.updatePerson(personId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  // Delete person mutation
  const deletePerson = useMutation({
    mutationFn: () => personService.deletePerson(personId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['person', personId] });
    },
  });

  return {
    person,
    isLoading,
    error,
    isRealtime,
    setIsRealtime,
    updatePerson: updatePerson.mutate,
    deletePerson: deletePerson.mutate,
    updatePersonStatus: updatePerson.status,
    deletePersonStatus: deletePerson.status,
  };
}

export function useTreePersons(treeId: string) {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch tree persons
  const {
    data: persons,
    isLoading,
    error
  } = useQuery({
    queryKey: ['treePersons', treeId],
    queryFn: () => personService.getPersonsByTree(treeId),
    enabled: !!treeId
  });

  // Set up real-time listener
  useEffect(() => {
    if (!treeId || !isRealtime) return;

    const unsubscribe = onSnapshot(
      collection(db, 'persons'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = { ...change.doc.data(), id: change.doc.id } as Person;
          
          if (data.treeId !== treeId) return;

          if (change.type === 'added' || change.type === 'modified') {
            queryClient.setQueryData(['treePersons', treeId], (old: Person[] = []) => {
              const filtered = old.filter(p => p.id !== data.id);
              return [...filtered, data];
            });
          } else if (change.type === 'removed') {
            queryClient.setQueryData(['treePersons', treeId], (old: Person[] = []) => {
              return old.filter(p => p.id !== data.id);
            });
          }
        });
      },
      (error) => {
        console.error('Tree persons subscription error:', error);
        setIsRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [treeId, isRealtime, queryClient]);

  // Create person mutation
  const createPerson = useMutation({
    mutationFn: (data: Omit<Person, 'id' | 'metadata'>) =>
      personService.createPerson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treePersons', treeId] });
    },
  });

  // Bulk operations
  const bulkCreatePersons = useMutation({
    mutationFn: (persons: Array<Omit<Person, 'id' | 'metadata'>>) =>
      personService.bulkCreatePersons(persons),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treePersons', treeId] });
    },
  });

  const bulkDeletePersons = useMutation({
    mutationFn: (personIds: string[]) =>
      personService.bulkDeletePersons(personIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treePersons', treeId] });
    },
  });

  return {
    persons,
    isLoading,
    error,
    isRealtime,
    setIsRealtime,
    createPerson: createPerson.mutate,
    bulkCreatePersons: bulkCreatePersons.mutate,
    bulkDeletePersons: bulkDeletePersons.mutate,
    createPersonStatus: createPerson.status,
    bulkCreateStatus: bulkCreatePersons.status,
    bulkDeleteStatus: bulkDeletePersons.status,
  };
}

export function usePersonSearch(treeId: string, searchTerm: string) {
  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: ['personSearch', treeId, searchTerm],
    queryFn: () => personService.searchPersons(treeId, searchTerm),
    enabled: !!treeId && searchTerm.length > 0
  });

  return {
    results,
    isLoading,
    error,
  };
}

export function usePersonsByBirthYear(treeId: string, year: number) {
  const {
    data: persons,
    isLoading,
    error
  } = useQuery({
    queryKey: ['personsByBirthYear', treeId, year],
    queryFn: () => personService.getPersonsByBirthYear(treeId, year),
    enabled: !!treeId
  });

  return {
    persons,
    isLoading,
    error,
  };
} 