import { useState } from 'react';
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
      body: JSON.stringify({ message: inputValue }),
    });

    if (response.status === 200 && response.headers.get('Content-Type') === 'text/event-stream;charset=UTF-8') {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const processStream = async () => {
        const { done, value } = await reader.read();

        if (done) {
          return;
        }

        const messages = decoder.decode(value);
        console.log('Messages received:', messages);

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
        <input type="text" value={inputValue} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
