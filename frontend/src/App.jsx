import React from 'react';
import { useSelector } from 'react-redux'; // Get role from Redux
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
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
      title: 'Main items',
    },
    {
      segment: 'election',
      title: 'Election',
      icon: <DashboardIcon />,
    },
    ...(userRole === 'admin'
      ? [
          {
            segment: 'admin-dashboard',
            title: 'Admin Dashboard',
            icon: <BarChartIcon />,
            children: [
              {
                segment: 'manage-users',
                title: 'Manage Users',
                icon: <DescriptionIcon />,
              },
              {
                segment: 'reports',
                title: 'Reports',
                icon: <DescriptionIcon />,
              },
            ],
          },
        ]
      : [
          {
            segment: 'facility-booking',
            title: 'Facility Booking',
            icon: <BarChartIcon />,
            children: [
              {
                segment: 'facility',
                title: 'Facilities',
                icon: <DescriptionIcon />,
              },
              {
                segment: 'booking-history',
                title: 'Booking History',
                icon: <DescriptionIcon />,
              },
            ],
          },
        ]),
  ];

  return (
    <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING} theme={demoTheme}>
      <Outlet /> {/* This will render nested routes */}
    </ReactRouterAppProvider>
  );
}

export default App;
