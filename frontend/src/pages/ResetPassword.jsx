import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert, Container } from '@mui/material';
import { useResetPasswordMutation } from '../features/auth/authApi';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPassword, { isLoading, error, isSuccess }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    await resetPassword({ token, password });
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10 }}>
        <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e0e0e0' }}>
          <Typography variant="h5" fontWeight={800} gutterBottom align="center">
            Reset Password
          </Typography>
          
          {isSuccess ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>Password updated successfully!</Alert>
              <Button variant="contained" onClick={() => navigate('/login')}>Login Now</Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                error={password !== confirmPassword && confirmPassword !== ''}
                helperText={password !== confirmPassword && confirmPassword !== '' ? "Passwords don't match" : ""}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isLoading || password !== confirmPassword}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;