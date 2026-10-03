import { useSelector } from 'react-redux';
import { Outlet } from 'react-router';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { extendTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HowToRegIcon from '@mui/icons-material/HowToReg';

// the full name does not fit next to the icons of the top bar on a phone
const FULL_TITLE = 'College Transparency System';
const SHORT_TITLE = 'CTS';

const theme = extendTheme({
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

// The side menu. An entry appears once the page behind it works for that role.
const everyone = [
  { segment: '', title: 'Dashboard', icon: <DashboardIcon /> },
];

const byRole = {
  admin: [
    { kind: 'header', title: 'Administration' },
    { segment: 'pending-request', title: 'Pending Requests', icon: <HowToRegIcon /> },
  ],
  student: [],
  faculty: [],
  doctor: [],
};

function App() {
  const user = useSelector((state) => state.auth.userData);
  const navigation = [...everyone, ...(byRole[user?.role] || [])];
  const narrow = useMediaQuery('(max-width:600px)');
  const branding = { title: narrow ? SHORT_TITLE : FULL_TITLE };

  return (
    <ReactRouterAppProvider navigation={navigation} branding={branding} theme={theme}>
      <Outlet />
    </ReactRouterAppProvider>
  );
}

export default App;
