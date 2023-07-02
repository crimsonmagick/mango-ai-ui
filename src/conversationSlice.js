import {createSlice} from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversations",
  initialState: {},
  reducers: {
    addConversation: (state, action) => {
      const {conversationId, messages, receiving} = action.payload;
      state[conversationId] = {
        id: conversationId,
        messages,
        receiving: receiving ? receiving : false
      };
    },
    selectConversation: (state, action) => {
      const {conversationId} = action.payload;
      // set the currentConversationId in Redux state
      state.currentConversationId = conversationId;
    },
    addMessageToConversation: (state, action) => {
      const {conversationId, message} = action.payload;
      state[conversationId].messages.push({content: message.contentFragment});
    },
    updateConversation: (state, action) => {
      const {conversationId, nextMessageIndex, receiving} = action.payload;
      if (nextMessageIndex) {
        state[conversationId].nextMessageIndex = nextMessageIndex;
      }
      if (receiving) {
        state[conversationId].receiving = receiving;
      }
    },
    updateMessageInConversation: (state, action) => {
      const {conversationId, index, message} = action.payload;
      const contentFragment = message.contentFragment;
      const targetConversation = state[conversationId]
      if (targetConversation) {
        const targetMessages = targetConversation.messages;
        targetMessages[index] = targetMessages.length <= index ? {content: contentFragment} :
          {...targetMessages[index], content: targetMessages[index].content + contentFragment};
      } else {
        console.warn(`Could not find conversation with conversationId=${conversationId} in selected conversation.`);
      }
    }
  }
});

export const {addConversation, selectConversation, addMessageToConversation, createConversation, updateConversation, updateMessageInConversation} = conversationSlice.actions;

export default conversationSlice.reducer;
