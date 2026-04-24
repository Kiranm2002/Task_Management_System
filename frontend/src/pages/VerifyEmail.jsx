import { useParams, useNavigate } from 'react-router-dom';
import { useVerifyEmailQuery } from '../features/auth/authApi';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { CheckCircleOutlined, ErrorOutlined } from '@mui/icons-material';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const { isLoading, isSuccess, isError } = useVerifyEmailQuery(token, {
    skip: !token, 
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f7fa' }}>
      <Paper elevation={3} sx={{ p: 5, borderRadius: 4, textAlign: 'center', maxWidth: 400 }}>
        {isLoading && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">Verifying your account...</Typography>
          </>
        )}

        {isSuccess && (
          <Box>
            <CheckCircleOutlined sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>Email Verified!</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your account is now active. You can now sign in.
            </Typography>
            <Button variant="contained" fullWidth onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </Box>
        )}

        {isError && (
          <Box>
            <ErrorOutlined sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>Verification Failed</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              The link is invalid or has expired.
            </Typography>
            <Button variant="outlined" fullWidth onClick={() => navigate('/register')}>
              Back to Register
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmail;