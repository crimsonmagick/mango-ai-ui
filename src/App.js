import {useEffect, useRef, useState} from 'react';
import {fetchConversationIds, fetchExpressions, sendExpression, startConversation} from './aiService.js';
import {useDispatch, useSelector} from 'react-redux';
import {addConversation, updateMessageInConversation} from './conversationSlice.js';
import './App.css';
import {MessageInputForm} from './MessageInputForm';
import {MessageViewer} from './MessageViewer.js';
import {Sidebar} from './Sidebar.js';

function App() {
  const [nextMessageIndex, setNextMessageIndex] = useState(0);
  const [receiving, setReceiving] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationsIds, setConversationIds] = useState([]);
  const messagesEndRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [model, setModel] = useState('gpt-4');

  const dispatch = useDispatch();
  const conversations = useSelector(state => state.conversations);

  const availableModels = ["gpt-3", "gpt-4", "davinci"];

  useEffect(() => {
    fetchConversationIds()
      .then(ids => {
        console.debug(`Fetched conversationIds=[${ids.join(',')}]`)
        setConversationIds(ids)
      });
  }, []);

  useEffect(() => {
    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
      setShouldScroll(false);
    }
  }, [conversations, shouldScroll]);

  const handleConversationSelect = (conversationId) => {
    setCurrentConversationId(conversationId);
    fetchExpressions(conversationId)
      .then(expressions => {
        const conversationMessages = expressions
          .filter(expression => expression.actorId !== "INITIAL_PROMPT");
        dispatch(addConversation({conversationId, messages: conversationMessages}));
        setNextMessageIndex(conversationMessages.length);
        setShouldScroll(true);
      });
  };

  const dispatchMessageUpdate = (conversationId, message, index) => {
    setShouldScroll(true);
    dispatch(updateMessageInConversation({conversationId, message, index}));
  };

  const newConversation = () => {
    setCurrentConversationId(null);
  };

  const handleFormSubmit = async (event, inputValue) => {
    event.preventDefault();
    setReceiving(true);

    const userMessageIndex = nextMessageIndex;
    const responseMessageIndex = nextMessageIndex + 1;

    try {
      if (currentConversationId == null) {
        let newConversationInitialized = false;
        const newConversationSetup = conversationId => {
          setCurrentConversationId(conversationId);
          setConversationIds(conversationsIds => [...conversationsIds, conversationId]);
          dispatch(addConversation({conversationId, messages: [{conversationId, content: inputValue}]}));
        };
        const newConversationCallback = message => {
          const conversationId = message.conversationId;
          if (!newConversationInitialized) {
            newConversationSetup(conversationId);
            newConversationInitialized = true;
          }
          dispatchMessageUpdate(conversationId, message, responseMessageIndex);
        };
        await startConversation(inputValue, newConversationCallback, model);

      } else {
        dispatchMessageUpdate(currentConversationId, {contentFragment: inputValue}, userMessageIndex);
        dispatchMessageUpdate(currentConversationId, {contentFragment: ''}, responseMessageIndex);
        setNextMessageIndex(prevIndex => prevIndex + 2);
        await sendExpression(currentConversationId, inputValue, message => dispatchMessageUpdate(currentConversationId, message, responseMessageIndex), model);
      }
    } catch (error) {
      console.error('Error invoking AiService: ', error);
      dispatchMessageUpdate(currentConversationId, {contentFragment: "!!ERROR IN RESPONSE STREAM!!"}, responseMessageIndex);
    }
    setReceiving(false);
  };

  const isSubmitDisabled = () => {
    return receiving;
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
      <span ref={messagesEndRef}></span>
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