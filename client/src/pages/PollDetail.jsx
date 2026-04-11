import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; 

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Get current logged-in user
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedOption, setSelectedOption] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(false); // Tracks anonymous votes in current session

  useEffect(() => {
    fetchPoll();
  }, [id, user]);

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/polls/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Poll not found');
        throw new Error('Failed to fetch poll');
      }
      const data = await response.json();
      setPoll(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedOption) return;

    setIsVoting(true);
    setError(null);

    try {
      const response = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: selectedOption })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      // Re-fetch the poll to get the updated vote counts
      await fetchPoll();
      setLocalHasVoted(true); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    
    try {
      const response = await fetch(`/api/polls/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete poll');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading-state">Loading poll details...</div>;
  if (error) return <div className="error-alert">{error}</div>;
  if (!poll) return <div className="error-alert">Poll not found.</div>;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  
  // Logic checks for what UI to display
  const isCreator = user && user.username === poll.creator_username;
  const hasVoted = poll.userVote !== null || localHasVoted;
  const canVote = user || poll.allow_anonymous;

  return (
    <div className="poll-detail-container">
      <header className="poll-header">
        <h2>{poll.title}</h2>
        {poll.description && <p className="poll-description">{poll.description}</p>}
        <div className="poll-meta">
          <span>Created by {poll.creator_username}</span>
          <span>•</span>
          <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        </div>
      </header>

      {/* VIEW 1: Show Results (if user has already voted) */}
      {hasVoted ? (
        <div className="results-container">
          <h3>Results</h3>
          {poll.options.map(option => {
            const percent = totalVotes === 0 ? 0 : Math.round((option.vote_count / totalVotes) * 100);
            const isUserChoice = option.id === poll.userVote || option.id === Number(selectedOption);
            
            return (
              <div key={option.id} className={`result-row ${isUserChoice ? 'user-choice' : ''}`}>
                <div className="result-info">
                  <span className="result-text">
                    {option.text} {isUserChoice && '(Your Vote)'}
                  </span>
                  <span className="result-stats">{option.vote_count} votes ({percent}%)</span>
                </div>
                {/* Vanilla CSS Progress Bar */}
                <div className="progress-bar-bg" style={{ width: '100%', backgroundColor: '#eee', height: '20px', borderRadius: '4px', marginTop: '5px' }}>
                  <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: isUserChoice ? '#4CAF50' : '#2196F3', height: '100%', borderRadius: '4px', transition: 'width 0.5s' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : 
      
      /* VIEW 2: Must Log In Prompt */
      !canVote ? (
        <div className="login-prompt">
          <h3>Log in to participate</h3>
          <p>This poll does not allow anonymous voting.</p>
          <Link to={`/login?redirect=/polls/${poll.id}`} className="btn-primary">
            Log in to Vote
          </Link>
        </div>
      ) : 
      
      /* VIEW 3: Voting Form */
      (
        <form onSubmit={handleVote} className="voting-form">
          <div className="options-list">
            {poll.options.map(option => (
              <label key={option.id} className="option-label">
                <input
                  type="radio"
                  name="poll_option"
                  value={option.id}
                  checked={selectedOption === String(option.id)}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <span className="option-text">{option.text}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="btn-submit" disabled={!selectedOption || isVoting}>
            {isVoting ? 'Submitting...' : 'Cast Vote'}
          </button>
        </form>
      )}

      {/* Delete Button (Only visible to the creator) */}
      {isCreator && (
        <div className="creator-actions">
          <button onClick={handleDelete} className="btn-danger">Delete Poll</button>
        </div>
      )}
    </div>
  );
}