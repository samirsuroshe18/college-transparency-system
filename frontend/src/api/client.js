import axios from 'axios';

// Every request goes to /api on the web app's own address; the dev server and the
// production host forward it to the API, so the login cookie needs no cross-site setup.
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

// the message the server sent, or a general one when it could not be reached
export const errorMessage = (error) => {
  if (error.response) {
    return error.response.data?.message || 'Something went wrong on the server.';
  }

  if (error.request) {
    return 'Unable to reach the server. Please check your connection.';
  }

  return error.message || 'Something went wrong. Please try again.';
};

// every answer has the shape { statusCode, data, message, success }
export const unwrap = (response) => response.data;

export default api;
