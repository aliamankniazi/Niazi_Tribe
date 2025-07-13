import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { CloudDownload, CloudUpload } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { DataExportService } from '@/services/DataExportService';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function DataExportDialog({ open, onClose, onComplete }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportService = new DataExportService();

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = await exportService.exportData();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `niazi-tribe-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup exported successfully');
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      toast.error('Failed to export backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      await exportService.importData(file);
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
      toast.error('Failed to import backup');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Backup and Restore</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Export your offline queue data as a backup file or import a previously exported backup.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<CloudDownload />}
            onClick={handleExport}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Export Backup'}
          </Button>

          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
            ref={fileInputRef}
            aria-label="Import backup file"
          />
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Import Backup'}
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Note: Importing a backup will replace all existing offline queue data.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 