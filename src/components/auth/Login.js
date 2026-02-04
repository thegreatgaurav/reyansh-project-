import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Grid,
} from "@mui/material";
import { Google, Factory } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import oauthConfig from "../../config/oauthConfig";

const Login = () => {
  const { signIn, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Initialize Google OAuth ONCE
  useEffect(() => {
    if (!window.google?.accounts?.oauth2) return;

    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: oauthConfig.clientId,
      scope: oauthConfig.scopes.join(" "),
      callback: async (response) => {
        if (!response?.access_token) {
          setError("Failed to authenticate with Google");
          return;
        }

        setLoading(true);
        try {
          await signIn(response.access_token);
          navigate("/dashboard");
        } catch (err) {
          setError(err.message || "Login failed");
        } finally {
          setLoading(false);
        }
      },
    });
  }, [signIn, navigate]);

  const handleGoogleSignIn = () => {
    setError(null);

    if (!window.tokenClient) {
      setError("Google OAuth not ready. Please refresh the page.");
      return;
    }

    window.tokenClient.requestAccessToken({ prompt: "consent" });
  };

  if (authLoading || loading) {
    return <LoadingSpinner message="Signing in..." />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
      }}
    >
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={8} md={5}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 5, textAlign: "center" }}>
              <Factory sx={{ fontSize: 40, mb: 2, color: "#f59e0b" }} />
              <Typography variant="h4" fontWeight={700} mb={2}>
                Reyansh Electronics
              </Typography>

              <Typography variant="body1" mb={4} color="text.secondary">
                Sign in to access your dashboard
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                size="large"
                onClick={handleGoogleSignIn}
                sx={{ py: 2, fontWeight: 600 }}
              >
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
