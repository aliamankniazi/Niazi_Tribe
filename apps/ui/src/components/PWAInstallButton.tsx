import { Fab, Tooltip, Zoom } from '@mui/material';
import { GetApp as InstallIcon } from '@mui/icons-material';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Zoom in={true}>
      <div className="fixed bottom-4 left-4 z-50">
        <Tooltip title="Install App" placement="right">
          <Fab
            color="primary"
            onClick={handleInstallClick}
            aria-label="Install application"
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <InstallIcon />
          </Fab>
        </Tooltip>
      </div>
    </Zoom>
  );
} 