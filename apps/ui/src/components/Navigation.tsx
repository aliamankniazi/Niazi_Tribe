import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  AccountTree as TreeIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <TreeIcon sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
          }}
        >
          Niazi Tribe
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/timeline"
            color="inherit"
            startIcon={<TimelineIcon />}
          >
            Timeline
          </Button>

          <IconButton
            onClick={handleMenu}
            color="inherit"
            edge="end"
            aria-label="account menu"
          >
            {user?.photoURL ? (
              <Avatar
                src={user.photoURL}
                alt={user.displayName || user.email || 'User avatar'}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountIcon />
            )}
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem component={RouterLink} to="/settings">
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
} 