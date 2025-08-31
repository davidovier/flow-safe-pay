import { configureStore } from '@reduxjs/toolkit';
import dealReducer from './slices/dealSlice';
import payoutReducer from './slices/payoutSlice';

export const store = configureStore({
  reducer: {
    deals: dealReducer,
    payouts: payoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;