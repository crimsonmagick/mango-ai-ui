import {useEffect, useRef, useState} from 'react';
import {fetchConversationIds, fetchExpressions, sendExpression, startConversation} from './aiService.js';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {materialDark} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {useDispatch, useSelector} from 'react-redux';
import {setMessages, updateMessage} from './messageSlice';
import './App.css';
import { MessageInputForm } from './MessageInputForm';

function App() {
  const [nextMessageIndex, setNextMessageIndex] = useState(0);
  const [receiving, setReceiving] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationsIds, setConversationIds] = useState([]);
  const messagesEndRef = useRef(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const [shouldScroll, setShouldScroll] = useState(false);

  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages);

  const handleCopyButtonPress = (codeString) => {
    navigator.clipboard.writeText(codeString)
      .then(() => {
        setCopyButtonText('Copied');
        setTimeout(() => setCopyButtonText('Copy'), 1500); // Reset after 1.5 seconds
      })
  };

  useEffect(() => {
    fetchConversationIds()
      .then(ids => {
          console.debug(`Fetched conversationIds=[${ids.join(',')}]`)
          setConversationIds(ids)
        }
      );
  }, []);

  useEffect(() => {
    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
      setShouldScroll(false);
    }
  }, [messages]);

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
    dispatch(updateMessage({ text, index }));
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

  const renderCodeBlock = ({node, inline, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    let language = match ? match[1] : '';
    return !inline ?
      <div className="codeContainer">
        <div className="codeHeader">
          <div>{language}</div>
          <button onClick={() => handleCopyButtonPress(codeString)}>
            {copyButtonText}
          </button>
        </div>
        <SyntaxHighlighter className="highlighter" language={language} style={materialDark} PreTag="div" children={codeString} {...props} />
      </div>
      : <code className="code-light-dark" {...props}>{children}</code>;
  };

  return (
    <div className="App">
      <div className="sidebar">
        <button onClick={newConversation}>Start New Conversation</button>
        {conversationsIds.map((conversationId) => (
          <button key={conversationId} onClick={() => handleConversationSelect(conversationId)}>
            {conversationId}
          </button>
        ))}
      </div>
      <div className="App-body">
        <div className="message-container">
          {messages.map((msg, index) => (
            <div className="message-wrapper" key={index}>
              <ReactMarkdown
                children={msg}
                components={{code: renderCodeBlock}}
              />
            </div>
          ))}
        </div>
        <span ref={messagesEndRef}></span>
        <MessageInputForm
          isSubmitDisabled={isSubmitDisabled}
          handleFormSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
}

export default App;