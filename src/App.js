import {useEffect, useState} from 'react';
import {fetchConversationIds, fetchExpressions, sendExpression, startConversation} from './aiService.js';
import {useDispatch, useSelector} from 'react-redux';
import {addConversation, updateConversation, updateMessageInConversation} from './conversationSlice.js';
import './App.css';
import {MessageInputForm} from './MessageInputForm';
import {MessageViewer} from './MessageViewer.js';
import {Sidebar} from './Sidebar.js';

function App() {
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationsIds, setConversationIds] = useState([]);

  const availableModels = ["gpt-3", "gpt-4", "davinci"];
  const [model, setModel] = useState('gpt-4');
  const dispatch = useDispatch();
  const conversations = useSelector(state => state.conversations);

  const setReceiving = (conversationId, receiving) => {
    dispatch(updateConversation({conversationId, receiving}));
  };

  const setNextMessageIndex = (conversationId, nextMessageIndex) => {
    dispatch(updateConversation({conversationId, nextMessageIndex}));
  };

  useEffect(() => {
    fetchConversationIds()
      .then(ids => {
        console.debug(`Fetched conversationIds=[${ids.join(',')}]`)
        setConversationIds(ids)
      });
  }, []);

  const handleConversationSelect = (conversationId) => {
    setCurrentConversationId(conversationId);
    if (!conversations[conversationId]) {
      fetchExpressions(conversationId)
        .then(expressions => {
          const conversationMessages = expressions
            .filter(expression => expression.actorId !== "INITIAL_PROMPT");
          dispatch(addConversation({conversationId, messages: conversationMessages}));
          setNextMessageIndex(conversationId, conversationMessages.length);
        });
    }
  };

  const dispatchMessageUpdate = (conversationId, message, index) => {
    dispatch(updateMessageInConversation({conversationId, message, index}));
  };

  const newConversation = () => {
    setCurrentConversationId(null);
  };

  const handleFormSubmit = async (event, inputValue) => {
    event.preventDefault();
    try {
      if (currentConversationId == null) {
        let newConversationInitialized = false;
        const newConversationSetup = conversationId => {
          setCurrentConversationId(conversationId);
          setConversationIds(conversationsIds => [...conversationsIds, conversationId]);
          dispatch(addConversation({conversationId, messages: [{conversationId, content: inputValue, receiving: false}]}));
        };
        const newConversationCallback = message => {
          const conversationId = message.conversationId;
          if (!newConversationInitialized) {
            newConversationSetup(conversationId);
            newConversationInitialized = true;
          }
          dispatchMessageUpdate(conversationId, message, 1); // response will always be after user message
          setNextMessageIndex(conversationId, 2);
        };
        const response = await startConversation(inputValue, newConversationCallback, model);
        setReceiving(response.conversationId, false);
      } else {
        const conversationId = currentConversationId;
        setReceiving(conversationId, true);

        const userMessageIndex = conversations[conversationId].nextMessageIndex;
        const responseMessageIndex = userMessageIndex + 1;

        dispatchMessageUpdate(conversationId, {contentFragment: inputValue}, userMessageIndex);
        dispatchMessageUpdate(conversationId, {contentFragment: ''}, responseMessageIndex);
        setNextMessageIndex(responseMessageIndex + 1);
        await sendExpression(conversationId, inputValue, message => dispatchMessageUpdate(conversationId, message, responseMessageIndex), model);
        setReceiving(conversationId, false);
      }
    } catch (error) {
      console.error('Error invoking AiService: ', error);
    }
  };

  const isSubmitDisabled = () => {
    return conversations[currentConversationId]?.receiving;
  };

  const prepareMessages = () => {
    return currentConversationId && conversations[currentConversationId] ? conversations[currentConversationId].messages.map(msg => msg.content) : [];
  };

  return (<div className="App">
    <Sidebar conversationIds={conversationsIds}
             newConversationHandler={newConversation}
             conversationSelectHandler={handleConversationSelect}
    />
    <div className="App-body">
      <MessageViewer messages={prepareMessages()}/>
      <MessageInputForm
        isSubmitDisabled={isSubmitDisabled}
        handleFormSubmit={handleFormSubmit}
        availableModels={availableModels}
        currentModel={model}
        updateModel={setModel}
      />
    </div>
  </div>);
}

export default App;