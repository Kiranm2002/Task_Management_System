import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Container } from '@mui/material';
import { useForgotPasswordMutation } from '../features/auth/authApi';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email).unwrap();
      setIsSent(true);
    } catch (err) { 
        console.error("Forgot password failed:", err);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Forgot Password?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email and we'll send you a link to reset your password.
          </Typography>

          {isSent ? (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Check your inbox! We've sent instructions to <strong>{email}</strong>.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isLoading}
                sx={{ borderRadius: 2, mb: 2 }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <Typography variant="body2">
            <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
              Back to Login
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;