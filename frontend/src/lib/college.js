// Fixed lists the forms offer. The server accepts the same values.
export const DEPARTMENTS = ['Computer', 'IT', 'EXTC', 'Civil', 'Mechanical'];
export const YEARS = ['FE', 'SE', 'TE', 'BE'];
export const DIVISIONS = ['A', 'B', 'C'];
export const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab assistant', 'Registrar', 'Director'];

// what an attached file may be; the server checks the same
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';
export const FILE_HINT = 'Optional. JPEG, PNG, WebP or PDF, up to 2 MB.';

// returns a message when the file cannot be sent, otherwise an empty string
export const fileProblem = (file) => {
  if (!file) return '';
  if (!FILE_TYPES.includes(file.type)) return 'Only images (JPEG, PNG, WebP) and PDF files are allowed';
  if (file.size > MAX_FILE_BYTES) return 'The file must be 2 MB or smaller';
  return '';
};

// where each profile status sends a student or faculty member
export const pathForStatus = (user) => {
  if (!user || user.role === 'admin' || user.role === 'doctor') return null;
  if (user.profileStatus === 'NotFilled') return '/select-role-screen';
  if (user.profileStatus === 'Pending') return '/profile-pending';
  if (user.profileStatus === 'Rejected') return '/profile-rejected';
  return null;
};
