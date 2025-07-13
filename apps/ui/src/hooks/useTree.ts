import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TreeService } from '@/services/firestore';
import type { Tree } from '@/types';

const treeService = new TreeService();

export function useTree(treeId: string) {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch tree data
  const {
    data: tree,
    isLoading,
    error
  } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => treeService.getTree(treeId),
    enabled: !!treeId
  });

  // Set up real-time listener
  useEffect(() => {
    if (!treeId || !isRealtime) return;

    const unsubscribe = onSnapshot(
      doc(db, 'trees', treeId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { ...snapshot.data(), id: snapshot.id } as Tree;
          queryClient.setQueryData(['tree', treeId], data);
        } else {
          queryClient.setQueryData(['tree', treeId], null);
        }
      },
      (error) => {
        console.error('Tree subscription error:', error);
        setIsRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [treeId, isRealtime, queryClient]);

  // Update tree mutation
  const updateTree = useMutation({
    mutationFn: (data: Partial<Omit<Tree, 'id' | 'ownerId'>>) =>
      treeService.updateTree(treeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
    },
  });

  // Delete tree mutation
  const deleteTree = useMutation({
    mutationFn: () => treeService.deleteTree(treeId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['tree', treeId] });
    },
  });

  return {
    tree,
    isLoading,
    error,
    isRealtime,
    setIsRealtime,
    updateTree: updateTree.mutate,
    deleteTree: deleteTree.mutate,
    updateTreeStatus: updateTree.status,
    deleteTreeStatus: deleteTree.status,
  };
}

export function useUserTrees() {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(true);

  // Fetch user's trees
  const {
    data: trees,
    isLoading,
    error
  } = useQuery({
    queryKey: ['userTrees'],
    queryFn: () => treeService.getUserTrees()
  });

  // Create tree mutation
  const createTree = useMutation({
    mutationFn: ({
      name,
      description
    }: {
      name: string;
      description: string;
    }) => treeService.createTree(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTrees'] });
    },
  });

  return {
    trees,
    isLoading,
    error,
    createTree: createTree.mutate,
    createTreeStatus: createTree.status,
  };
}

export function usePublicTrees(limit = 10) {
  const {
    data: trees,
    isLoading,
    error
  } = useQuery({
    queryKey: ['publicTrees', limit],
    queryFn: () => treeService.getPublicTrees(limit)
  });

  return {
    trees,
    isLoading,
    error,
  };
}

export function useTreeSearch(searchTerm: string) {
  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: ['treeSearch', searchTerm],
    queryFn: () => treeService.searchTrees(searchTerm),
    enabled: searchTerm.length > 0
  });

  return {
    results,
    isLoading,
    error,
  };
} 