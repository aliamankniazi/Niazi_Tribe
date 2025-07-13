import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RelationshipService } from '@/services/firestore';
import type { Relationship } from '@/types';

const relationshipService = new RelationshipService();

export function useRelationship(relationshipId: string) {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch relationship data
  const {
    data: relationship,
    isLoading,
    error
  } = useQuery({
    queryKey: ['relationship', relationshipId],
    queryFn: () => relationshipService.getRelationship(relationshipId),
    enabled: !!relationshipId
  });

  // Set up real-time listener
  useEffect(() => {
    if (!relationshipId || !isRealtime) return;

    const unsubscribe = onSnapshot(
      doc(db, 'relationships', relationshipId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { ...snapshot.data(), id: snapshot.id } as Relationship;
          queryClient.setQueryData(['relationship', relationshipId], data);
        } else {
          queryClient.setQueryData(['relationship', relationshipId], null);
        }
      },
      (error) => {
        console.error('Relationship subscription error:', error);
        setIsRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [relationshipId, isRealtime, queryClient]);

  // Update relationship mutation
  const updateRelationship = useMutation({
    mutationFn: (data: Partial<Omit<Relationship, 'id' | 'treeId' | 'from' | 'to' | 'metadata'>>) =>
      relationshipService.updateRelationship(relationshipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship', relationshipId] });
    },
  });

  // Delete relationship mutation
  const deleteRelationship = useMutation({
    mutationFn: () => relationshipService.deleteRelationship(relationshipId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['relationship', relationshipId] });
    },
  });

  return {
    relationship,
    isLoading,
    error,
    isRealtime,
    setIsRealtime,
    updateRelationship: updateRelationship.mutate,
    deleteRelationship: deleteRelationship.mutate,
    updateRelationshipStatus: updateRelationship.status,
    deleteRelationshipStatus: deleteRelationship.status,
  };
}

export function usePersonRelationships(personId: string) {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch person relationships
  const {
    data: relationships,
    isLoading,
    error
  } = useQuery({
    queryKey: ['personRelationships', personId],
    queryFn: () => relationshipService.getRelationshipsByPerson(personId),
    enabled: !!personId
  });

  // Set up real-time listener
  useEffect(() => {
    if (!personId || !isRealtime) return;

    const unsubscribe = onSnapshot(
      collection(db, 'relationships'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = { ...change.doc.data(), id: change.doc.id } as Relationship;
          
          if (data.from !== personId && data.to !== personId) return;

          if (change.type === 'added' || change.type === 'modified') {
            queryClient.setQueryData(['personRelationships', personId], (old: Relationship[] = []) => {
              const filtered = old.filter(r => r.id !== data.id);
              return [...filtered, data];
            });
          } else if (change.type === 'removed') {
            queryClient.setQueryData(['personRelationships', personId], (old: Relationship[] = []) => {
              return old.filter(r => r.id !== data.id);
            });
          }
        });
      },
      (error) => {
        console.error('Person relationships subscription error:', error);
        setIsRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [personId, isRealtime, queryClient]);

  // Create relationship mutation
  const createRelationship = useMutation({
    mutationFn: (data: Omit<Relationship, 'id' | 'metadata'>) =>
      relationshipService.createRelationship(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personRelationships', personId] });
    },
  });

  // Bulk operations
  const bulkCreateRelationships = useMutation({
    mutationFn: (relationships: Array<Omit<Relationship, 'id' | 'metadata'>>) =>
      relationshipService.bulkCreateRelationships(relationships),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personRelationships', personId] });
    },
  });

  const bulkDeleteRelationships = useMutation({
    mutationFn: (relationshipIds: string[]) =>
      relationshipService.bulkDeleteRelationships(relationshipIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personRelationships', personId] });
    },
  });

  // Specialized queries
  const {
    data: parentChildRelationships,
    isLoading: parentChildLoading,
    error: parentChildError
  } = useQuery({
    queryKey: ['parentChildRelationships', personId],
    queryFn: () => relationshipService.getParentChildRelationships(personId),
    enabled: !!personId
  });

  const {
    data: spouseRelationships,
    isLoading: spouseLoading,
    error: spouseError
  } = useQuery({
    queryKey: ['spouseRelationships', personId],
    queryFn: () => relationshipService.getSpouseRelationships(personId),
    enabled: !!personId
  });

  const {
    data: adoptiveRelationships,
    isLoading: adoptiveLoading,
    error: adoptiveError
  } = useQuery({
    queryKey: ['adoptiveRelationships', personId],
    queryFn: () => relationshipService.getAdoptiveRelationships(personId),
    enabled: !!personId
  });

  return {
    relationships,
    isLoading,
    error,
    isRealtime,
    setIsRealtime,
    createRelationship: createRelationship.mutate,
    bulkCreateRelationships: bulkCreateRelationships.mutate,
    bulkDeleteRelationships: bulkDeleteRelationships.mutate,
    createRelationshipStatus: createRelationship.status,
    bulkCreateStatus: bulkCreateRelationships.status,
    bulkDeleteStatus: bulkDeleteRelationships.status,
    parentChildRelationships,
    parentChildLoading,
    parentChildError,
    spouseRelationships,
    spouseLoading,
    spouseError,
    adoptiveRelationships,
    adoptiveLoading,
    adoptiveError,
  };
}

export function useTreeRelationships(treeId: string) {
  const {
    data: relationships,
    isLoading,
    error
  } = useQuery({
    queryKey: ['treeRelationships', treeId],
    queryFn: () => relationshipService.getRelationshipsByTree(treeId),
    enabled: !!treeId
  });

  return {
    relationships,
    isLoading,
    error,
  };
} 