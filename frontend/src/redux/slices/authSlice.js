import { createSlice } from "@reduxjs/toolkit"; // ✅ Make sure this is present

const initialState = {
    status: false,
    userData: null, // ✅ Ensure this is initially null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.status = true;
            state.userData = action.payload || {}; // ✅ Ensure fallback object
        },
        currentUser: (state, action) => {
            state.status = true;
            state.userData = action.payload || {}; // ✅ Ensure fallback object
        },
    }
});

export const { login, currentUser } = authSlice.actions;
export default authSlice.reducer;
