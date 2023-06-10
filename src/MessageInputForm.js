import React, {useState} from 'react';
import {updateMessage} from './messageSlice';

export function MessageInputForm({isSubmitDisabled, handleFormSubmit }) {
  const [inputValue, setInputValue] = useState('');
  const [textAreaRows, setTextAreaRows] = useState(1);

  const handleInputTextChange = (event) => {
    updateTextBox(event.target.value);
  };

  const updateTextBox = (inputText) => {
    const numRows = inputText.split('\n').length;
    setTextAreaRows(numRows);
    setInputValue(inputText);
  };

  const handleKeyDown = async (event) => {
    if (!isSubmitDisabled() && event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      await handleFormSubmit(event, inputValue);
    }
  };

  return (
    <form onSubmit={(event) => handleFormSubmit(event, inputValue)} className="form-container">
      <div className="input-wrapper">
        <textarea value={inputValue} onChange={handleInputTextChange} onKeyDown={handleKeyDown} rows={textAreaRows}/>
        <button type="submit" disabled={isSubmitDisabled() || inputValue === null || inputValue.trim() === ''}><i className="fa fa-paper-plane"></i></button>
      </div>
    </form>
  );
}
