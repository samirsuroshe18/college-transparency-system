import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./config/router.jsx";
import { Provider } from "react-redux";
import store from "./redux/store/store.js";
import { setSessionEndedHandler } from "./api/client.js";
import { logout } from "./redux/slices/authSlice.js";

// when the server stops accepting the login, the app forgets it and asks for a new one
setSessionEndedHandler(() => {
  store.dispatch(logout());
  router.navigate("/login", { replace: true });
});


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
