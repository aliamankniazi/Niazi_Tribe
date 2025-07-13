import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { Navigation } from './Navigation';
import { PWAManager } from './PWAManager';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncManager } from './SyncManager';

export function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1200,
            display: 'flex',
            gap: 1,
          }}
        >
          <OfflineIndicator />
          <SyncManager />
        </Box>

        <PWAManager />
        <Outlet />
      </Box>
    </Box>
  );
} 