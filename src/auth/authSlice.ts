import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { User } from '@/api/authApi';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isBootstrapping: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isBootstrapping = false;
    },
    setAccessToken: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.accessToken = action.payload.accessToken;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(state.accessToken);
      state.isBootstrapping = false;
    },
    finishBootstrap: (state) => {
      state.isBootstrapping = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isBootstrapping = false;
    },
  },
});

export const { setCredentials, setAccessToken, updateUser, finishBootstrap, logout } =
  authSlice.actions;

export default authSlice.reducer;
