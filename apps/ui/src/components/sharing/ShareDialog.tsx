import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Box
} from '@mui/material';
import { Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';
import { TreeSharingService } from '../../services/TreeSharingService';
import { Tree, TreeAccess, AccessRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  treeId: string;
}

const sharingService = new TreeSharingService();

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, onClose, treeId }) => {
  const { user } = useAuth();
  const [tree, setTree] = useState<Tree | null>(null);
  const [accessList, setAccessList] = useState<TreeAccess[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccessRole>('viewer');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (open && treeId) {
      loadTreeData();
    }
  }, [open, treeId]);

  const loadTreeData = async () => {
    const treeData = await sharingService.getTree(treeId);
    const accessData = await sharingService.getTreeAccess(treeId);
    
    setTree(treeData);
    setAccessList(accessData);
    setIsPublic(treeData?.isPublic || false);
  };

  const handleInvite = async () => {
    if (!user || !email) return;

    try {
      await sharingService.createInvite(treeId, email, role, user.uid);
      setEmail('');
      await loadTreeData();
    } catch (error) {
      console.error('Failed to create invite:', error);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      await sharingService.revokeAccess(treeId, userId);
      await loadTreeData();
    } catch (error) {
      console.error('Failed to revoke access:', error);
    }
  };

  const handlePublicToggle = async () => {
    try {
      await sharingService.setTreePublic(treeId, !isPublic);
      setIsPublic(!isPublic);
    } catch (error) {
      console.error('Failed to update public status:', error);
    }
  };

  const isOwner = user && tree?.ownerId === user.uid;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Family Tree</DialogTitle>
      <DialogContent>
        {isOwner && (
          <Box mb={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={handlePublicToggle}
                  color="primary"
                />
              }
              label="Make tree public"
            />
            <Typography variant="caption" display="block">
              Public trees can be viewed by anyone with the link
            </Typography>
          </Box>
        )}

        <Divider />

        <Box my={2}>
          <Typography variant="subtitle1">Invite People</Typography>
          <Box display="flex" gap={1} mt={1}>
            <TextField
              fullWidth
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
            />
            <FormControl size="small" style={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as AccessRole)}
                label="Role"
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                {isOwner && <MenuItem value="owner">Owner</MenuItem>}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleInvite}
              disabled={!email}
              startIcon={<SendIcon />}
            >
              Invite
            </Button>
          </Box>
        </Box>

        <Divider />

        <Box mt={2}>
          <Typography variant="subtitle1">People with access</Typography>
          <List>
            {accessList.map((access) => (
              <ListItem key={access.userId}>
                <ListItemText
                  primary={access.userId} // TODO: Get user display name
                  secondary={access.role}
                />
                {isOwner && access.userId !== user?.uid && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRevokeAccess(access.userId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 