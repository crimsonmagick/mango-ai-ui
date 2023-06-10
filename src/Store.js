import { configureStore } from '@reduxjs/toolkit';
import messageReducer from './messageSlice.js';

const store = configureStore({
  reducer: {
    messages: messageReducer
  },
});

export default store;
