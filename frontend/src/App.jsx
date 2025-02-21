import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Outlet } from 'react-router';
import { extendTheme } from '@mui/material/styles'

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
  // {
  //   segment: 'login',
  //   title: 'Orders',
  //   icon: <ShoppingCartIcon />,
  // },
  // {
  //   kind: 'divider',
  // },
  // {
  //   kind: 'header',
  //   title: 'Analytics',
  // },
  {
    segment: 'dashboard',
    title: 'Facility Booking',
    icon: <BarChartIcon />,
    children: [
      {
        segment: 'facility',
        title: 'Facilities',
        icon: <DescriptionIcon />,
      },
      {
        segment: 'admin',
        title: 'Admin Pannel',
        icon: <DescriptionIcon />,
      },
    ],
  },
  {
    segment: 'pending-request',
    title: 'Requests',
    icon: <LayersIcon />,
  },
];

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
  return (
    <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING} theme={demoTheme}>
      <Outlet /> {/* This will render your nested routes */}
    </ReactRouterAppProvider>
  );
}

export default App;
