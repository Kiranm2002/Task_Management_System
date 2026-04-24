import { AppBar, Toolbar, IconButton, Typography, InputBase, Badge, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { Search as SearchIcon, Notifications, AccountCircle, Menu as MenuIcon } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logOut, selectCurrentUser } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../features/notifications/components/NotificationBell';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.08) },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: { marginLeft: theme.spacing(3), width: '400px' },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
  },
}));

const Navbar = ({ onDrawerToggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#fff', color: '#2c3e50', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'primary.main' }}>
          Task Management System
        </Typography>

        <Search>
          <SearchIconWrapper><SearchIcon color="action" /></SearchIconWrapper>
          <StyledInputBase placeholder="Smart search tasks, teams..." />
        </Search>

        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          
          <NotificationBell/>
          <IconButton size="large" edge="end" onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.9rem' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;