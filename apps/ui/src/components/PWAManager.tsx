import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Button } from '@mui/material';

export default function PWAManager() {
  const [showReload, setShowReload] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW registered:', registration);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowReload(true);
    }
  }, [needRefresh]);

  const handleReload = () => {
    setShowReload(false);
    setNeedRefresh(false);
    updateServiceWorker(true);
  };

  return (
    <Snackbar
      open={showReload}
      message="New version available"
      action={
        <Button color="secondary" size="small" onClick={handleReload}>
          Reload
        </Button>
      }
    />
  );
} 