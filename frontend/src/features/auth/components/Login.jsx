import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../authApi';
import { setCredentials } from '../authSlice';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Container,
  Paper,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userData = await login(form).unwrap();
      dispatch(setCredentials({ ...userData }));
      
      const role = userData.user.role;
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError(err?.data?.message || 'Unauthorized: Please check your credentials');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
            }}
          >
            <LockOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, fontSize: '0.85rem' }}>
            Enter your credentials to access the Workspace
          </Typography>

          {error && (
            <Alert severity="error" variant="filled" sx={{ width: '100%', mb: 2, borderRadius: 2, py: 0, fontSize: '0.8rem' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              variant="outlined"
              size="small"
              margin="dense"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              size="small"
              margin="dense"
              value={form.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
            />

            <Box sx={{ mt: 0.5, mb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                component="button"
                type="button"
                variant="caption"
                underline="hover"
                onClick={() => navigate('/forgot-password')}
                sx={{ fontSize: '0.75rem' }}
              >
                Forgot Password?
              </Link>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="medium"
              disabled={isLoading}
              sx={{
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
              }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="caption" sx={{ mt: 3, fontSize: '0.75rem' }}>
            New to the platform?{' '}
            <Link
              component="button"
              fontWeight={600}
              underline="always"
              onClick={() => navigate('/register')}
            >
              Create an account
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;