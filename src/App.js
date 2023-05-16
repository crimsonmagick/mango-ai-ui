import {useState} from 'react';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [textAreaRows, setTextAreaRows] = useState(1);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    updateTextAreaRows();
  };

  const updateTextAreaRows = () => {
    const numRows = inputValue.split('\n').length;
    setTextAreaRows(numRows);
  };


  const updateMessage = (text, index) => {
    setMessages((prevMessages) => {
      const messages = prevMessages.slice();
      messages.length <= index ? messages[index] = text : messages[index] = messages[index] + text;
      return messages;
    });
  };

  const incrementActiveMessageIndex = () => {
    setActiveMessageIndex(prevIndex => prevIndex + 1)
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch('http://localhost:8080/mango/melancholy/pal/streaming/conversations/expressions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({message: inputValue}),
    });

    if (response.status === 200 && response.headers.get('Content-Type') === 'application/x-ndjson') {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const textFragmentSink = {
        write: async (textString) => {
          try {
            const messageObject = JSON.parse(textString);
            if (messageObject.choices && messageObject.choices[0] && messageObject.choices[0].text !== null) {
              const text = messageObject.choices[0].text;
              updateMessage(text, activeMessageIndex);
            }
          } catch (error) {
            const errorMessage = `Unable to parse received text string. textString=${textString}`;
            console.error(errorMessage, error);
            throw new Error(errorMessage, {cause: error});
          }
        },
        close: () => console.log('Stream closed'),
        abort: (err) => console.error('Stream error:', err)
      };

      const writableStream = new WritableStream(textFragmentSink);
      const writer = writableStream.getWriter();

      const processFragmentStream = async () => {
        let {done, value} = await reader.read();

        while (!done) {
          const textChunk = decoder.decode(value);
          const textStrings = textChunk.split('\n')
            .filter(text => text !== "" && text !== '\n');

          for (const textString of textStrings) {
            await writer.write(textString);
          }

          ({done, value} = await reader.read());
        }

        await writer.close();
        incrementActiveMessageIndex();
      };

      processFragmentStream().catch((error) => {
        console.error('Error processing stream:', error);
      });
    } else {
      console.error('Error fetching data:', response.statusText);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      handleFormSubmit(event);
    }
  };


  return (
    <div className="App">
      <div className="App-body">
        <div className="message-container">
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
        <form onSubmit={handleFormSubmit} className="form-container">
          <div className="input-wrapper">
            <textarea value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}   rows={textAreaRows} />
            <button type="submit"><i className="fa fa-paper-plane"></i></button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;