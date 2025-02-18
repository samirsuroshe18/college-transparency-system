import { createSlice } from "@reduxjs/toolkit";

// you cannot pass multiple parameters like login(true, {}). The createSlice reducers always receive one argument: action, which contains payload

const initialState = {
    status: false,
    userData: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.status = true;
            state.userData = action.payload;
        },
        currentUser: (state, action) => {
            state.status = true;
            state.userData = action.payload;
        },
    }
})

export const { login, currentUser } = authSlice.actions;

export default authSlice.reducer;