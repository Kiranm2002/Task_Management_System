import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../authApi';
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
  Link,
  MenuItem,
  Grid,
  Fade
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  PersonAddOutlined, 
  MarkEmailReadOutlined,
  ArrowForward 
} from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await register(form).unwrap();
      setIsSubmitted(true); 
    } catch (err) {
      setError(err?.data?.message || 'Registration failed. Please try again.');
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
      <Container maxWidth="sm"> 
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, md: 4 }, 
            borderRadius: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }}
        >
          {!isSubmitted ? (
            <Fade in={!isSubmitted}>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      background: 'linear-gradient(45deg, #2196F3, #21CBF3)'
                    }}
                  >
                    <PersonAddOutlined sx={{ color: '#fff' }} />
                  </Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">
                    Create Account
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Join the workspace and start collaborating
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Full Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleChange}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="user">Standard User</MenuItem>
                        <MenuItem value="admin">System Admin</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      mt: 3,
                      py: 1.2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Get Started'}
                  </Button>
                </Box>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Already have an account?{' '}
                    <Link
                      component="button"
                      variant="caption"
                      fontWeight={700}
                      underline="hover"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          ) : (
            <Fade in={isSubmitted}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto'
                  }}
                >
                  <MarkEmailReadOutlined sx={{ fontSize: 32, color: '#1976d2' }} />
                </Box>
                
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Verify Your Email
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2, lineHeight: 1.6 }}>
                  A verification link has been sent to <strong>{form.email}</strong>. 
                  Please check your inbox and follow the instructions to activate your workspace.
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{ borderRadius: 2, py: 1, fontWeight: 600 }}
                >
                  Go to Login
                </Button>
                
                <Typography variant="caption" display="block" sx={{ mt: 3, color: 'text.secondary' }}>
                  Didn't receive the email? Check your spam folder or contact support.
                </Typography>
              </Box>
            </Fade>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;