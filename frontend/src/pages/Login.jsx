import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";


import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/auth/login", form);
      const{user} = res.data
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken",res.data.refreshToken)
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>

          
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={600}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login to manage your tasks
            </Typography>
          </Box>

          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          
          <Box component="form" onSubmit={handleSubmit}>

            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              margin="normal"
              value={form.email}
              onChange={handleChange}
              required
            />

            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              value={form.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 2, borderRadius: 2 }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>

          
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 3 }}
          >
            Don’t have an account?{" "}
            <span
              style={{ color: "#1976d2", cursor: "pointer", fontWeight: 500 }}
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </Typography>

        </CardContent>
      </Card>
    </Box>
  );
}