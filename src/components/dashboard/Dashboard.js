import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
} from "@mui/material";
import { Construction, Dashboard as DashboardIcon } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading spinner if auth is loading
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography variant="h6">Checking access...</Typography>
        </Box>
      </Container>
    );
  }

  // Access control
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error" sx={{ mt: 4 }}>
          Access Denied: Please log in to continue.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <DashboardIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
          <Typography variant="h4" gutterBottom>
            Executive Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Overview of factory operations, performance metrics, and KPIs
        </Typography>
      </Paper>

      {/* Coming Soon Message */}
      <Paper 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Construction sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
        </Box>
        
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
          Executive Dashboard
        </Typography>
        
        <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
          Coming Soon
        </Typography>
        
        <Typography variant="body1" sx={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
          We're working hard to bring you a comprehensive CEO dashboard with advanced analytics, 
          real-time metrics, and executive insights. Stay tuned for updates!
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            In the meantime, you can access other features through the navigation menu above.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;
