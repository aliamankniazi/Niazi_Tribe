import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
} from '@mui/material';
import type { Person } from '@/types';
import { format } from 'date-fns';

interface ConflictResolutionDialogProps {
  open: boolean;
  localPerson: Person;
  remotePerson: Person;
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void;
  onClose: () => void;
}

export default function ConflictResolutionDialog({
  open,
  localPerson,
  remotePerson,
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'merge'>('merge');

  const getChanges = (local: Person, remote: Person) => {
    const changes: string[] = [];

    // Compare basic fields
    ['name', 'lastName', 'gender', 'dob', 'dod', 'birthPlace'].forEach((field) => {
      if (local[field] !== remote[field]) {
        changes.push(`${field}: "${local[field]}" → "${remote[field]}"`);
      }
    });

    // Compare arrays
    ['parents', 'children', 'spouses'].forEach((field) => {
      const added = remote[field].filter(id => !local[field].includes(id));
      const removed = local[field].filter(id => !remote[field].includes(id));
      
      if (added.length > 0) {
        changes.push(`Added ${field}: ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        changes.push(`Removed ${field}: ${removed.join(', ')}`);
      }
    });

    // Compare life events
    const localEventIds = new Set(local.lifeEvents.map(e => e.id));
    const remoteEventIds = new Set(remote.lifeEvents.map(e => e.id));
    
    const addedEvents = remote.lifeEvents.filter(e => !localEventIds.has(e.id));
    const removedEvents = local.lifeEvents.filter(e => !remoteEventIds.has(e.id));
    
    if (addedEvents.length > 0) {
      changes.push(`Added events: ${addedEvents.map(e => e.title).join(', ')}`);
    }
    if (removedEvents.length > 0) {
      changes.push(`Removed events: ${removedEvents.map(e => e.title).join(', ')}`);
    }

    return changes;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Resolve Conflict
        <Typography variant="subtitle2" color="text.secondary">
          Changes detected in "{localPerson.name} {localPerson.lastName}"
        </Typography>
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="subtitle1">Local Version</Typography>
              <Typography variant="caption" color="text.secondary">
                Last modified: {format(new Date(localPerson.metadata.lastModified), 'PPpp')}
              </Typography>
            </div>
            <Chip
              label={`v${localPerson.metadata.version}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <Typography variant="subtitle1">Remote Version</Typography>
              <Typography variant="caption" color="text.secondary">
                Last modified: {format(new Date(remotePerson.metadata.lastModified), 'PPpp')}
              </Typography>
            </div>
            <Chip
              label={`v${remotePerson.metadata.version}`}
              color="secondary"
              variant="outlined"
              size="small"
            />
          </div>

          <Typography variant="h6">Changes</Typography>
          <List dense>
            {getChanges(localPerson, remotePerson).map((change, index) => (
              <ListItem key={index}>
                <ListItemText primary={change} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h6">Resolution Options</Typography>
          <div className="space-y-2">
            <Button
              fullWidth
              variant={selectedResolution === 'local' ? 'contained' : 'outlined'}
              onClick={() => setSelectedResolution('local')}
            >
              Keep Local Changes
            </Button>
            <Button
              fullWidth
              variant={selectedResolution === 'remote' ? 'contained' : 'outlined'}
              onClick={() => setSelectedResolution('remote')}
            >
              Accept Remote Changes
            </Button>
            <Button
              fullWidth
              variant={selectedResolution === 'merge' ? 'contained' : 'outlined'}
              onClick={() => setSelectedResolution('merge')}
            >
              Merge Changes
            </Button>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onResolve(selectedResolution)}
        >
          Apply Resolution
        </Button>
      </DialogActions>
    </Dialog>
  );
} 