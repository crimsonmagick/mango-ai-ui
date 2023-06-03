import {useEffect, useRef, useState} from 'react';
import {fetchConversationIds, fetchExpressions, sendExpression, startConversation} from './AiService';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [nextMessageIndex, setNextMessageIndex] = useState(0);
  const [textAreaRows, setTextAreaRows] = useState(1);
  const [receiving, setReceiving] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [conversationsIds, setConversationIds] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversationIds()
      .then(ids => {
          console.debug(`Fetched conversationIds=[${ids.join(',')}]`)
          setConversationIds(ids)
        }
      );
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages, inputValue]);

  const handleConversationSelect = (conversationId) => {
    setCurrentConversationId(conversationId);
    fetchExpressions(conversationId)
      .then(expressions => {
        const conversationMessages = expressions
          .filter(expression => expression.actorId !== "INITIAL_PROMPT")
          .map(expression => expression.content);
        setMessages(conversationMessages);
        setNextMessageIndex(conversationMessages.length);
      });
  };
  const handleInputTextChange = (event) => {
    const updatedValue = event.target.value;
    const numRows = updatedValue.split('\n').length;
    setTextAreaRows(numRows);
    setInputValue(updatedValue);
  };

  const updateMessage = (text, index) => {
    setMessages((prevMessages) => {
      const messages = prevMessages.slice();
      messages.length <= index ? messages[index] = text : messages[index] = messages[index] + text;
      return messages;
    });
  };

  const newConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setReceiving(true);

    const userMessageIndex = nextMessageIndex;
    const responseMessageIndex = nextMessageIndex + 1;

    updateMessage(inputValue, userMessageIndex);
    updateMessage('', responseMessageIndex);
    setNextMessageIndex(prevIndex => prevIndex + 2)

    setInputValue('');
    try {
      if (currentConversationId == null) {
        const details = await startConversation(inputValue, text => updateMessage(text, responseMessageIndex));
        setCurrentConversationId(details.conversationId);
        setConversationIds(conversationsIds => [...conversationsIds, details.conversationId]);
      } else {
        await sendExpression(currentConversationId, inputValue, text => updateMessage(text, responseMessageIndex));
      }
    } catch (error) {
      console.error('Error invoking AiService: ', error);
      updateMessage("!!ERROR IN RESPONSE STREAM!!", responseMessageIndex);
    }
    setReceiving(false);
  };

  const handleKeyDown = async (event) => {
    if (!isSubmitDisabled() && event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      await handleFormSubmit(event);
    }
  };

  const isSubmitDisabled = () => {
    return receiving || inputValue === null || inputValue.trim() === ""
  }

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
              <ReactMarkdown key={index} children={msg} />
            </div>
          ))}
        </div>
        <form onSubmit={handleFormSubmit} className="form-container">
          <div className="input-wrapper" ref={messagesEndRef}>
            <textarea value={inputValue} onChange={handleInputTextChange} onKeyDown={handleKeyDown} rows={textAreaRows}/>
            <button type="submit" disabled={isSubmitDisabled()}><i className="fa fa-paper-plane"></i></button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;