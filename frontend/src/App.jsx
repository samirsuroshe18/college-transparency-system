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
import { extendTheme } from '@mui/material/styles'
import GavelIcon from "@mui/icons-material/Gavel";
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import DescriptionIcon from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BookingPage from './pages/FacilityBooking/BookingPage';
import AdminPanel from './pages/FacilityBooking/AdminPanel';

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
  const userRole = useSelector(state => state.auth.userData);

  const superAdminNavigation = [
    {
      kind: 'header',
      title: 'Admin Section',
    },
    {
      segment: 'pending-request',
      title: 'Pending Requests',
      icon: <ShoppingCartIcon />,
    },
  ];

  const studentNavigation = [
    {
      kind: 'header',
      title: 'Student Section',
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
      segment: 'health',
      title: 'Health',
      icon: <LayersIcon />,
    },
    {
      segment: 'facility',
      title: 'Facility Booking',
      icon: <BusinessCenterIcon />,
    },
    {
      segment: 'application-page',
      title: 'Applications Portal',
      icon: <AssignmentIcon />,
    },
    {
      segment: 'wallofshame',
      title: 'Wall of Shame',
      icon: <GavelIcon />,
    },
    {
      segment: 'complaints',
      title: 'Complaint Box',
      icon: <ReportProblemIcon />,
    },
  ];
  
   
  const NAVIGATION = [
    ...studentNavigation,
    // {
    //   kind: 'header',
    //   title: 'Student Section',
    // },
    // {
    //   segment: 'notices',
    //   title: 'Announce',
    //   icon: <AnnouncementIcon />,
    // },
    // {
    //   segment: 'pending-request',
    //   title: 'Pending Requests',
    //   icon: <ShoppingCartIcon />,
    // },
    // {
    //   segment: 'college-dashboard',
    //   title: 'College Dashboard',
    //   icon: <BusinessCenterIcon />,
    // },
    // {
    //   segment: 'student-dashboard',
    //   title: 'Student Dashboard',
    //   icon: <BusinessCenterIcon />,
    // },
    // {
    //   segment: 'admin-dashboard',
    //   title: 'Admin ',
    //   icon: <BusinessCenterIcon />,
    // },
    // dashboardRoutes,
    // {
    //   segment: 'election',
    //   title: 'Elections',
    //   icon: <HowToVoteIcon />,
    // },
    // {
    //   segment: 'dashboard',
    //   title: 'Facilities Booking',
    //   icon: <BusinessCenterIcon />,
    // },
    // {
    //   segment: 'applications',
    //   title: 'Applications',
    //   icon: <AssignmentIcon />,
    // },
    // {
    //   segment: 'wallofshame',
    //   title: 'Wall of Shame',
    //   icon: <GavelIcon />,
    // },
    // {
    //   segment: 'admin-wallofshame',
    //   title: 'Wall of Shame',
    //   icon: <GavelIcon />,
    // },
    // {
    //   segment: 'complaints',
    //   title: 'Complaint Box',
    //   icon: <ReportProblemIcon />,
    // },
    // {
    //   segment: 'admin-complaints',
    //   title: 'Admin Complaints',
    //   icon: <ReportProblemIcon />,
    // },
    // {
    //   segment: 'events',
    //   title: 'Events',
    //   icon: <EventIcon />,
    // },
    // {
    //   segment: 'application-page',
    //   title: 'Applicationuser',
    //   icon: <EventIcon />,
    // },
    // {
    //   segment: 'admin-application',
    //   title: 'ApplicationAdmin',
    //   icon: <EventIcon />,
    // },
  ];

  return (
    <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING}>
      <Outlet /> {/* This will render nested routes */}
    </ReactRouterAppProvider>
  );
}

export default App;