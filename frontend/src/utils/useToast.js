import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { showNotificationWithTimeout } from '../redux/slices/notificationSlice';
import { errorMessage } from '../api/client';

// Short messages at the corner of the screen: toast.success("Saved"), toast.error(err).
// error takes what a request threw, or a plain message.
const useToast = () => {
  const dispatch = useDispatch();

  return useMemo(() => ({
    success: (message) => dispatch(showNotificationWithTimeout({ show: true, type: 'success', message })),
    error: (problem) => dispatch(showNotificationWithTimeout({
      show: true,
      type: 'error',
      message: typeof problem === 'string' ? problem : errorMessage(problem),
    })),
  }), [dispatch]);
};

export default useToast;
