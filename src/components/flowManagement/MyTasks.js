import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Chip,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { Refresh, Assignment, CheckCircle, Schedule, Warning } from '@mui/icons-material';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import flowService from '../../services/flowService';
import poService from '../../services/poService';
import { useAuth } from '../../context/AuthContext';

const MyTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  
  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const myTasks = await flowService.getUserTasks(user.email);
      setTasks(myTasks);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      setError(error.message || 'Failed to fetch your tasks');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && user.email) {
      fetchMyTasks();
    }
  }, [user]);
  
  const handleViewTask = async (task) => {
    setSelectedTask(task);
    
    try {
      // Fetch the audit log for this task
      const log = await flowService.getPOAuditLog(task.POId);
      setAuditLog(log);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      setAuditLog([]);
    }
    
    setDetailOpen(true);
  };
  
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedTask(null);
    setAuditLog([]);
  };
  
  const handleAdvanceTask = async (task, file) => {
    try {
      setLoading(true);
      setError(null);
      
      // Upload file if exists
      if (file) {
        await poService.uploadPODocument(task.POId, file);
      }
      
      // Advance the task
      const updatedTask = await flowService.advanceTask(task.POId);
      
      // Show success message
      setSuccessMessage(`Task ${task.POId} advanced successfully to ${updatedTask.Status}`);
      setSuccessOpen(true);
      
      // Close detail dialog if open
      if (selectedTask && selectedTask.POId === task.POId) {
        setDetailOpen(false);
        setSelectedTask(null);
      }
      
      // Refresh tasks
      await fetchMyTasks();
    } catch (error) {
      console.error('Error advancing task:', error);
      setError(error.message || 'Failed to advance task');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            zIndex: 0
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            My Tasks
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9,
              fontWeight: 300,
              maxWidth: 600
            }}
          >
            Tasks assigned to you ({tasks.length})
          </Typography>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e3f2fd',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f8fbff 100%)'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 700 }}>
                {tasks.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#546e7a' }}>
                Total Assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e3f2fd',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {tasks.filter(task => task.Status === 'DELIVERED').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#546e7a' }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e3f2fd',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%)'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {tasks.filter(task => task.Status !== 'DELIVERED').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#546e7a' }}>
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid #e3f2fd',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" sx={{ color: '#546e7a' }}>
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {error && (
        <ErrorMessage 
          error={error} 
          retry={fetchMyTasks} 
        />
      )}
      
      <Card 
        elevation={0}
        sx={{ 
          border: '1px solid #e3f2fd',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #e3f2fd'
          }}>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#1976d2',
                  fontWeight: 700,
                  mb: 0.5
                }}
              >
                My Assigned Tasks
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#546e7a'
                }}
              >
                Manage and track your assigned tasks
              </Typography>
            </Box>
            <Button 
              startIcon={<Refresh />} 
              onClick={fetchMyTasks} 
              disabled={loading}
              variant="outlined"
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: '#f8fbff'
                }
              }}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <LoadingSpinner message="Loading your tasks..." />
          ) : tasks.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                backgroundColor: '#f8fbff',
                border: '1px solid #e3f2fd',
                borderRadius: 2
              }}
            >
              <Assignment sx={{ fontSize: 80, color: '#e3f2fd', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#546e7a', mb: 1 }}>
                No Tasks Assigned
              </Typography>
              <Typography variant="body1" sx={{ color: '#9e9e9e', mb: 3 }}>
                You don't have any tasks assigned to you at the moment.
              </Typography>
              <Button 
                variant="outlined"
                onClick={fetchMyTasks}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    backgroundColor: '#f8fbff'
                  }
                }}
              >
                Check Again
              </Button>
            </Paper>
          ) : (
            <TaskList
              tasks={tasks}
              onViewTask={handleViewTask}
              onAdvanceTask={handleAdvanceTask}
              title="My Assigned Tasks"
            />
          )}
        </CardContent>
      </Card>
      
      <TaskDetail
        task={selectedTask}
        open={detailOpen}
        onClose={handleCloseDetail}
        onAdvance={handleAdvanceTask}
        auditLog={auditLog}
      />
      
      <Snackbar
        open={successOpen}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSuccessClose} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#2e7d32' }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyTasks; 