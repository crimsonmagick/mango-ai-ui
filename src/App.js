import {useEffect, useRef, useState} from 'react';
import {fetchConversationIds, fetchExpressions, sendExpression, startConversation} from './aiService.js';
import {useDispatch, useSelector} from 'react-redux';
import {setMessages, updateMessage} from './messageSlice';
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

  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages);

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
  }, [messages, shouldScroll]);

  const handleConversationSelect = (conversationId) => {
    setCurrentConversationId(conversationId);
    fetchExpressions(conversationId)
      .then(expressions => {
        const conversationMessages = expressions
          .filter(expression => expression.actorId !== "INITIAL_PROMPT")
          .map(expression => expression.content);
        dispatch(setMessages(conversationMessages));
        setNextMessageIndex(conversationMessages.length);
        setShouldScroll(true);
      });
  };

  const dispatchMessageUpdate = (text, index) => {
    setShouldScroll(true);
    dispatch(updateMessage({text, index}));
  };

  const newConversation = () => {
    setCurrentConversationId(null);
    dispatch(setMessages([]));
  };

  const handleFormSubmit = async (event, inputValue) => {
    event.preventDefault();
    setReceiving(true);

    const userMessageIndex = nextMessageIndex;
    const responseMessageIndex = nextMessageIndex + 1;

    dispatchMessageUpdate(inputValue, userMessageIndex);
    dispatchMessageUpdate('', responseMessageIndex);
    setNextMessageIndex(prevIndex => prevIndex + 2);

    try {
      if (currentConversationId == null) {
        const details = await startConversation(inputValue, text => dispatchMessageUpdate(text, responseMessageIndex));
        setCurrentConversationId(details.conversationId);
        setConversationIds(conversationsIds => [...conversationsIds, details.conversationId]);
      } else {
        await sendExpression(currentConversationId, inputValue, text => dispatchMessageUpdate(text, responseMessageIndex));
      }
    } catch (error) {
      console.error('Error invoking AiService: ', error);
      dispatchMessageUpdate("!!ERROR IN RESPONSE STREAM!!", responseMessageIndex);
    }
    setReceiving(false);
  };

  const isSubmitDisabled = () => {
    return receiving;
  };

  return (<div className="App">
    <Sidebar conversationIds={conversationsIds}
             newConversationHandler={newConversation}
             conversationSelectHandler={handleConversationSelect}
    />
    <div className="App-body">
      <MessageViewer messages={messages}/>
      <span ref={messagesEndRef}></span>
      <MessageInputForm
        isSubmitDisabled={isSubmitDisabled}
        handleFormSubmit={handleFormSubmit}
      />
    </div>
  </div>);
}

export default App;