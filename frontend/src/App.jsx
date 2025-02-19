import React from 'react';
import { useSelector } from 'react-redux'; // Get role from Redux
import SettingsIcon from '@mui/icons-material/Settings';
import AnnouncementIcon from '@mui/icons-material/Campaign';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EventIcon from '@mui/icons-material/Event';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Outlet } from 'react-router';
import { extendTheme } from '@mui/material/styles';

const BRANDING = {
  title: 'CollegeConnect',
};

const demoTheme = extendTheme({
  colorSchemes: { light: true, dark: true },
  colorSchemeSelector: 'class',
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function App() {
  const userRole = useSelector((state) => state.auth.user?.role); // Fetch user role from Redux

  // Define sidebar navigation conditionally
  const NAVIGATION = [
    {
      kind: 'header',
      title: 'Main Items',
    },
    {
      segment: 'notices',
      title: 'Announce',
      icon: <AnnouncementIcon />,
    },
    {
      segment: 'election',
      title: 'Elections',
      icon: <HowToVoteIcon />,
    },
    {
      segment: 'facility-booking',
      title: 'Facilities Booking',
      icon: <BusinessCenterIcon />,
    },
    {
      segment: 'applications',
      title: 'Applications',
      icon: <AssignmentIcon />,
    },
    {
      segment: 'wallofshame',
      title: 'Wall of Shame',
      icon: <ReportProblemIcon />,
    },
    {
      segment: 'complaints',
      title: 'Complaint Box',
      icon: <ReportProblemIcon />,
    },
    {
      segment: 'events',
      title: 'Events',
      icon: <EventIcon />,
    },
    ...(userRole === 'admin'
      ? [
          {
            segment: 'config',
            title: 'Config',
            icon: <SettingsIcon />,
          },
        ]
      : []),
  ];

  return (
    <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING} theme={demoTheme}>
      <Outlet /> {/* This will render nested routes */}
    </ReactRouterAppProvider>
  );
}

export default App;
