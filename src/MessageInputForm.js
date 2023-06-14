import React, {useState} from 'react';

export function MessageInputForm({isSubmitDisabled, handleFormSubmit, availableModels, currentModel, updateModel}) {
  const [inputValue, setInputValue] = useState('');
  const [textAreaRows, setTextAreaRows] = useState(1);
  const MAX_ROW_NUMBER = 10;

  const handleInputTextChange = (event) => {
    updateTextBox(event.target.value);
  };

  const updateTextBox = (inputText) => {
    const numRows = inputText.split('\n').length;
    setTextAreaRows(numRows > MAX_ROW_NUMBER ? MAX_ROW_NUMBER : numRows);
    setInputValue(inputText);
  };

  const handleKeyDown = async (event) => {
    if (!isSubmitDisabled() && event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      updateTextBox('');
      await handleFormSubmit(event, inputValue);
    }
  };

  const updateModelHandler = (event) => {
    event.preventDefault();
    updateModel(event.target.value);
  }

  return (
    <form
      onSubmit={(event) => {
        handleFormSubmit(event, inputValue);
        updateTextBox('');
      }}
      className="form-container">
      <div className="input-wrapper">
        <div className="select-wrapper">
          <select className="model-select" value={currentModel} onChange={updateModelHandler}>
            {
              availableModels.map(
                (model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                )
              )
            }
          </select>
        </div>
        <textarea value={inputValue} onChange={handleInputTextChange} onKeyDown={handleKeyDown} rows={textAreaRows}/>
        <div className="button-wrapper">
          <button type="submit" disabled={isSubmitDisabled() || inputValue === null || inputValue.trim() === ''}><i className="fa fa-paper-plane"></i></button>
        </div>
      </div>
    </form>
  );
}
