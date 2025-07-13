import { useState, useEffect } from 'react';
import {
  Drawer,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudOff as OfflineIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Refresh as RetryIcon,
  SaveAlt as BackupIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { QueueEntry, SyncStatus } from '@/types';
import { OfflineQueueService } from '@/services/OfflineQueueService';
import { personService } from '@/services/firestore';
import DataExportDialog from './DataExportDialog';

const queueService = new OfflineQueueService();

export default function SyncManager() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(queueService.getSyncStatus());
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    action: async () => {},
  });

  useEffect(() => {
    const unsubscribe = queueService.subscribe((status) => {
      setSyncStatus(status);
      loadEntries();
    });

    return () => unsubscribe();
  }, []);

  const loadEntries = async () => {
    const allEntries = await queueService.getAllEntries();
    setEntries(allEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading('Syncing changes...');
    try {
      const pendingEntries = await queueService.getPendingEntries();
      let successCount = 0;
      let failureCount = 0;
      
      for (const entry of pendingEntries) {
        try {
          switch (entry.action) {
            case 'create':
              await personService.create(entry.data);
              break;
            case 'update':
              await personService.update(entry.documentId, entry.data);
              break;
            case 'delete':
              await personService.delete(entry.documentId);
              break;
          }
          await queueService.removeEntry(entry.id);
          successCount++;
        } catch (error) {
          await queueService.updateEntry(entry.id, {
            status: 'failed',
            error: error.message,
            retryCount: entry.retryCount + 1,
          });
          failureCount++;
        }
      }

      if (failureCount === 0) {
        toast.success(`Successfully synced ${successCount} changes`, {
          id: toastId,
          icon: '✅',
          duration: 4000,
        });
      } else {
        toast.error(`Sync completed with ${failureCount} errors. ${successCount} changes were successful.`, {
          id: toastId,
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error('Failed to sync changes. Please try again.', {
        id: toastId,
        duration: 4000,
      });
    } finally {
      setSyncing(false);
      await loadEntries();
    }
  };

  const handleRetry = async (entry: QueueEntry) => {
    const toastId = toast.loading(`Retrying ${entry.action} for ${entry.metadata.displayName}...`);
    try {
      await queueService.updateEntry(entry.id, {
        status: 'pending',
        error: undefined,
      });
      await loadEntries();
      toast.success('Action queued for retry', {
        id: toastId,
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to retry action', {
        id: toastId,
        duration: 3000,
      });
    }
  };

  const handleDelete = async (entry: QueueEntry) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Queued Action',
      message: `Are you sure you want to delete this ${entry.action} action for ${entry.metadata.displayName}?`,
      action: async () => {
        await queueService.removeEntry(entry.id);
        await loadEntries();
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleClearQueue = () => {
    setConfirmDialog({
      open: true,
      title: 'Clear Queue',
      message: 'Are you sure you want to clear all pending changes? This action cannot be undone.',
      action: async () => {
        await queueService.clearQueue();
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  return (
    <>
      <Tooltip title="Sync Status">
        <IconButton
          color={syncStatus.hasPendingChanges ? 'warning' : 'default'}
          onClick={() => setDrawerOpen(true)}
        >
          <Badge
            badgeContent={syncStatus.pendingCount + syncStatus.failedCount}
            color={syncStatus.failedCount > 0 ? 'error' : 'warning'}
          >
            {!syncStatus.isOnline ? (
              <OfflineIcon />
            ) : syncStatus.hasPendingChanges ? (
              <SyncIcon />
            ) : (
              <SyncIcon color="success" />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="w-96 p-4">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6">Sync Manager</Typography>
            <div className="space-x-2">
              {syncStatus.hasPendingChanges && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSync}
                  disabled={!syncStatus.isOnline || syncing}
                  startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
                >
                  Sync Now
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setExportDialogOpen(true)}
                startIcon={<BackupIcon />}
              >
                Backup
              </Button>
              {entries.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearQueue}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Typography variant="subtitle2">Status:</Typography>
              <Chip
                size="small"
                icon={syncStatus.isOnline ? <SyncIcon /> : <OfflineIcon />}
                label={syncStatus.isOnline ? 'Online' : 'Offline'}
                color={syncStatus.isOnline ? 'success' : 'warning'}
              />
            </div>
            {syncStatus.lastSuccessfulSync && (
              <Typography variant="caption" color="text.secondary">
                Last synced: {format(new Date(syncStatus.lastSuccessfulSync), 'PPpp')}
              </Typography>
            )}
          </div>

          <List>
            {entries.map((entry) => (
              <ListItem
                key={entry.id}
                className="border rounded mb-2"
              >
                <ListItemText
                  primary={
                    <div className="flex items-center space-x-2">
                      <span>{entry.metadata.displayName}</span>
                      <Chip
                        size="small"
                        label={entry.action}
                        color={entry.status === 'failed' ? 'error' : 'primary'}
                      />
                    </div>
                  }
                  secondary={
                    <div className="space-y-1">
                      <Typography variant="caption" display="block">
                        {format(new Date(entry.timestamp), 'PPpp')}
                      </Typography>
                      {entry.error && (
                        <Typography variant="caption" color="error">
                          Error: {entry.error}
                        </Typography>
                      )}
                    </div>
                  }
                />
                <ListItemSecondaryAction>
                  {entry.status === 'failed' && (
                    <IconButton
                      edge="end"
                      onClick={() => handleRetry(entry)}
                      size="small"
                    >
                      <RetryIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(entry)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {entries.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              className="text-center mt-4"
            >
              No pending changes
            </Typography>
          )}
        </div>
      </Drawer>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
          >
            Cancel
          </Button>
          <Button
            onClick={() => confirmDialog.action()}
            color="error"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <DataExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onComplete={loadEntries}
      />
    </>
  );
} 