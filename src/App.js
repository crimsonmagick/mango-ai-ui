import {useState} from 'react';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

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

      const sink = {
        write: async (textString) => {
          try {
            const messageObject = JSON.parse(textString);
            if (messageObject.choices && messageObject.choices[0] && messageObject.choices[0].text != null) {
              const text = messageObject.choices[0].text;
              console.log(text);
            }
          } catch (error) {
            const errorMessage = `Unable to parse received text string. textString=${textString}`;
            console.error(errorMessage, error);
            throw new Error(errorMessage, {cause: error});
          }
        },
        close: () => console.log('Stream closed'),
        abort: (err) => console.error('Stream error:', err),
      };

      const writableStream = new WritableStream(sink);
      const writer = writableStream.getWriter();

      const processStream = async () => {
        const ret = await reader.read();
        const {done, value} = ret;

        if (done) {
          await writer.close();
          return;
        }

        const textChunk = decoder.decode(value);
        const textStrings = textChunk.split('\n').filter(text => text !== "" && text !== '\n');
        for (const textString of textStrings) {
          await writer.write(textString);
        }

        // Recursively call processStream to read the next chunk of data
        await processStream();
      };

      processStream().catch((error) => {
        console.error('Error processing stream:', error);
      });
    } else {
      console.error('Error fetching data:', response.statusText);
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleFormSubmit}>
        <input type="text" value={inputValue} onChange={handleInputChange}/>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;