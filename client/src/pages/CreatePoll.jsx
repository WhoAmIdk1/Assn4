import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreatePoll() {
  const navigate = useNavigate();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  
  // UI State
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (indexToRemove) => {
    if (options.length <= 2) return; // Enforce minimum of 2 options
    setOptions(options.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Validation
    if (!title.trim()) {
      return setError('Poll title is required.');
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      return setError('You must provide at least 2 non-empty options.');
    }

    // 2. Submit to API
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          allow_anonymous: allowAnonymous,
          options: validOptions
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      // 3. Success! Redirect to the new poll
      navigate(`/polls/${data.id}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-poll-container">
      <h2>Create a New Poll</h2>
      
      {error && <div className="error-alert">{error}</div>}

      <form onSubmit={handleSubmit} className="poll-form">
        <div className="form-group">
          <label htmlFor="title">Poll Question</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is your favorite programming language?"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any extra context here..."
            rows="3"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={allowAnonymous}
              onChange={(e) => setAllowAnonymous(e.target.checked)}
            />
            Allow anonymous voting (users don't need to be logged in)
          </label>
        </div>

        <div className="options-section">
          <h3>Poll Options</h3>
          {options.map((option, index) => (
            <div key={index} className="option-input-group">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required={index < 2} // First two are strictly required by HTML5
              />
              {options.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => removeOption(index)}
                  className="btn-remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addOption} 
            className="btn-add-option"
          >
            + Add Another Option
          </button>
        </div>

        <button 
          type="submit" 
          className="btn-submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}