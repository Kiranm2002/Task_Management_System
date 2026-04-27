import { AppBar, Toolbar, IconButton, Typography, InputBase, Box, Avatar, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { Search as SearchIcon, Menu as MenuIcon, Security as SecurityIcon, CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logOut, selectCurrentUser } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../features/notifications/components/NotificationBell';
import { useSetup2FAMutation, useVerifyAndEnable2FAMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';

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
  
  const [open2FA, setOpen2FA] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [otp, setOtp] = useState('');

  const [statusModal, setStatusModal] = useState({ open: false, success: false, message: '' });
  
  const [setup2FA] = useSetup2FAMutation();
  const [verify2FA] = useVerifyAndEnable2FAMutation();

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
  };

  const handleOpenSetup = async () => {
    try {
      const res = await setup2FA().unwrap();
      setQrCode(res.qrCodeUrl);
      setOpen2FA(true);
      setAnchorEl(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    try {
      await verify2FA(otp).unwrap();
      dispatch(setCredentials({ 
      ...user, 
      user: { ...user, isTwoFactorEnabled: true } 
    }));
      setOpen2FA(false);
      setQrCode(null);
      setOtp('');
      setStatusModal({
        open: true,
        success: true,
        message: "Two-Factor Authentication enabled successfully"
      });
    } catch (err) {
      setStatusModal({
        open: true,
        success: false,
        message: err?.data?.message || "Verification failed"
      });
    }
  };

  return (
    <>
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
            {!user?.twoFactorEnabled && (
              <MenuItem onClick={handleOpenSetup}>
                <SecurityIcon sx={{ fontSize: 18, mr: 1 }} /> Enable 2FA
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Dialog open={open2FA} onClose={() => setOpen2FA(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Setup Two-Factor Auth</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Scan this QR code with Google Authenticator or Authy
          </Typography>
          {qrCode && <Box component="img" src={qrCode} sx={{ width: '200px', mx: 'auto', mb: 2 }} />}
          <TextField
            fullWidth
            label="6-Digit OTP"
            variant="outlined"
            size="small"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen2FA(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleVerify}>Verify & Enable</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusModal.open} onClose={() => setStatusModal({ ...statusModal, open: false })} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          {statusModal.success ? (
            <CheckCircleOutlined sx={{ color: 'success.main', fontSize: 60, mb: 2 }} />
          ) : (
            <ErrorOutlined sx={{ color: 'error.main', fontSize: 60, mb: 2 }} />
          )}
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {statusModal.success ? "Success" : "Error"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusModal.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={() => setStatusModal({ ...statusModal, open: false })} color={statusModal.success ? "success" : "primary"}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;