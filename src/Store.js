import { configureStore } from '@reduxjs/toolkit';
import conversationReducer from './conversationSlice.js'

const store = configureStore({
  reducer: {
    conversations: conversationReducer
  },
});

export default store;
