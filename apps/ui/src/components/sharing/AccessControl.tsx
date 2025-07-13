import React, { useEffect, useState } from 'react';
import { TreeSharingService } from '../../services/TreeSharingService';
import { AccessRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Alert, CircularProgress, Box } from '@mui/material';

interface AccessControlProps {
  treeId: string;
  requiredRole?: AccessRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const sharingService = new TreeSharingService();

export const AccessControl: React.FC<AccessControlProps> = ({
  treeId,
  requiredRole = 'viewer',
  children,
  fallback
}) => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        const tree = await sharingService.getTree(treeId);
        if (!tree) {
          setHasAccess(false);
          return;
        }

        setIsPublic(tree.isPublic);

        if (tree.isPublic && requiredRole === 'viewer') {
          setHasAccess(true);
          return;
        }

        const userRole = await sharingService.getUserRole(treeId, user.uid);
        if (!userRole) {
          setHasAccess(false);
          return;
        }

        const roles: AccessRole[] = ['viewer', 'editor', 'owner'];
        const userRoleIndex = roles.indexOf(userRole);
        const requiredRoleIndex = roles.indexOf(requiredRole);

        setHasAccess(userRoleIndex >= requiredRoleIndex);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [treeId, user, requiredRole]);

  if (hasAccess === null) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert severity="error">
        {!user
          ? "Please sign in to access this content."
          : isPublic
          ? `You need ${requiredRole} access to perform this action.`
          : "You don't have permission to access this content."}
      </Alert>
    );
  }

  return <>{children}</>;
}; 