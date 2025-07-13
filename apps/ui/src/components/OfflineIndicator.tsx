import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Chip } from '@mui/material';
import { WifiOff as OfflineIcon, Sync as SyncIcon } from '@mui/icons-material';

export default function OfflineIndicator() {
  const { isOnline, hasPendingWrites } = useOfflineStatus();

  if (isOnline && !hasPendingWrites) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {!isOnline && (
        <Chip
          icon={<OfflineIcon />}
          label="Offline"
          color="warning"
          variant="outlined"
        />
      )}
      {hasPendingWrites && (
        <Chip
          icon={<SyncIcon />}
          label="Syncing..."
          color="info"
          variant="outlined"
        />
      )}
    </div>
  );
} 