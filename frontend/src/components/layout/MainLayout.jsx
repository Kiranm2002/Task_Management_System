import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatAssistant from '../../features/ai/components/ChatAssistant';

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onDrawerToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 260px)` }, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Toolbar />
        <Outlet />
      </Box>
      <ChatAssistant/>
    </Box>
  );
};

export default MainLayout;