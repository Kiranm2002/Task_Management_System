import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLogin2FAMutation } from '../authApi';
import { setCredentials, selectTempUserId } from '../authSlice';

const Login2FA = () => {
  const [otp, setOtp] = useState('');
  const userId = useSelector(selectTempUserId);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login2FA, { isLoading }] = useLogin2FAMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ success: false, message: '' });

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const data = await login2FA({ userId, token: otp }).unwrap();
      
      setModalConfig({
        success: true,
        message: 'Authentication successful! Setting up your session...'
      });
      setModalOpen(true);

      window.tempAuthData = data; 

    } catch (err) {
      setModalConfig({
        success: false,
        message: err?.data?.message || 'Invalid code. Please check your app and try again.'
      });
      setModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (modalConfig.success && window.tempAuthData) {
      const data = window.tempAuthData;
      dispatch(setCredentials(data));
      navigate(data.user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
      delete window.tempAuthData;
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <Typography variant="h5" fontWeight={800} gutterBottom color="primary">
          Security Check
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Please enter the 6-digit code from your authenticator device.
        </Typography>

        <Box component="form" onSubmit={handleVerify}>
          <TextField
            fullWidth
            label="OTP Code"
            variant="filled"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="· · · · · ·"
            inputProps={{ 
              maxLength: 6, 
              style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' } 
            }}
            required
            sx={{ mb: 3, '& .MuiFilledInput-root': { backgroundColor: '#f8f9fa' } }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
            disabled={isLoading || otp.length < 6}
            sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </Button>
        </Box>
      </Paper>

      <Dialog 
        open={modalOpen} 
        onClose={handleModalClose}
        PaperProps={{ sx: { borderRadius: 3, p: 2, textAlign: 'center' } }}
      >
        <DialogTitle>
          {modalConfig.success ? (
            <CheckCircleOutlined sx={{ color: 'success.main', fontSize: 80 }} />
          ) : (
            <ErrorOutlined sx={{ color: 'error.main', fontSize: 80 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" fontWeight={700}>
            {modalConfig.success ? 'Identity Verified' : 'Access Denied'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {modalConfig.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={handleModalClose} 
            variant="contained" 
            color={modalConfig.success ? 'success' : 'primary'}
            sx={{ px: 4, borderRadius: 2 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login2FA;