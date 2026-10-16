/**
 * features/notifications/notificationsSlice.js
 * Manages the in-app notification feed.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/api/axiosInstance';
import { logout } from '@/features/auth/authSlice';

// ── Async thunks ─────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('/notifications');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to load notifications.');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to mark notification.');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/notifications/mark-all-read');
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message ?? 'Failed to mark all notifications.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  unreadCount: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Push a single new notification (e.g. from a WebSocket or polling)
    addNotification(state, action) {
      state.items.unshift(action.payload);
      if (!action.payload.read) state.unreadCount += 1;
    },
    // Manually wipe all notifications (e.g. called on user-switch)
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // markNotificationRead
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find(n => n._id === action.payload);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // markAllNotificationsRead
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      })
      // ── Clear notifications when any user logs out ─────────────────────────
      // Without this, the previous account's notifications remain in the Redux
      // store and are shown to the next user who logs in on the same browser.
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { addNotification, resetNotifications } = notificationsSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectNotifications    = (s) => s.notifications.items;
export const selectUnreadCount      = (s) => s.notifications.unreadCount;
export const selectNotificationsStatus = (s) => s.notifications.status;

export default notificationsSlice.reducer;
