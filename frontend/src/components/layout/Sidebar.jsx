import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box, Typography } from '@mui/material';
import { Dashboard, Assignment, Group, BarChart, Settings, SmartToy, Layers, People,Task } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';

const drawerWidth = 260;

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <Dashboard />, 
      path: user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard', 
      roles: ['admin', 'user'] 
    },
    { 
      text: 'Kanban Board', 
      icon: <Layers />, 
      path: user?.role === 'admin' ? '/admin-dashboard/kanban' : '/user-dashboard/kanban', 
      roles: ['admin', 'user'] 
    },
    { 
      text: 'Tasks', 
      icon: <Task />, 
      path: '/admin-dashboard/tasks', 
      roles: ['admin'] 
    },
    { 
      text: 'Projects', 
      icon: <Assignment />, 
      path: '/admin-dashboard/projects', 
      roles: ['admin'] 
    },
    { 
      text: 'My Projects', 
      icon: <Assignment />, 
      path: '/user-dashboard/my-projects', 
      roles: ['user'] 
    },
    { 
      text: 'Teams', 
      icon: <Group />, 
      path: '/admin-dashboard/teams', 
      roles: ['admin'] 
    },
    { 
      text: 'Users', 
      icon: <People />, 
      path: '/admin-dashboard/users', 
      roles: ['admin'] 
    },
    { 
      text: 'Analytics', 
      icon: <BarChart />, 
      path: '/admin-dashboard/analytics', 
      roles: ['admin'] 
    },
    
  ];

  const drawerContent = (
    <Box>
      <Toolbar />
      <Box sx={{ pt: 1, px: 3, pb: 1 }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Workspace
        </Typography>
      </Box>
      <List sx={{ px: 2 }}>
        {menuItems
          .filter(item => item.roles.includes(user?.role))
          .map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: isSelected ? 700 : 500 }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
      <Divider sx={{ my: 2, mx: 2 }} />
      
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ 
          display: { xs: 'none', sm: 'block' }, 
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            borderRight: '1px solid #e0e0e0', 
            backgroundColor: '#fcfcfc' 
          } 
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;