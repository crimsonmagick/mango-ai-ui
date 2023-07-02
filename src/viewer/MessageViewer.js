import {useEffect, useRef, useState} from 'react';
import {CodeViewer} from './CodeViewer.js';

export function MessageViewer({messages}) {

  const [stickToBottom, setStickToBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const scrollRef = useRef();

  const isFullyScrolled = target => target.scrollHeight - target.scrollTop === target.clientHeight;

  const handleScroll = element => {
    if (isFullyScrolled(element.target)) {
      setStickToBottom(true);
    } else {
      setStickToBottom(false);
    }
  }

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  });

  useEffect(() => {
    if (stickToBottom) {
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }
  }, [messages]);

  return (
    <div className="message-container" ref={scrollRef}>
      {messages.map((msg, index) => (
        <div className="message-wrapper" key={index}>
          <CodeViewer
            message={msg}
          />
        </div>
      ))}
      <span ref={messagesEndRef}></span>
    </div>
  );
}