import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function MyPolls() {
  const { user } = useContext(AuthContext);
  const [myPolls, setMyPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If there's no user logged in, stop loading and return
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMyPolls();
  }, [user]);

  const fetchMyPolls = async () => {
    try {
      const response = await fetch('/api/polls');
      if (!response.ok) throw new Error('Failed to fetch polls');
      
      const allPolls = await response.json();
      
      // Filter out only the polls created by the logged-in user
      const userPolls = allPolls.filter(poll => poll.creator_username === user.username);
      setMyPolls(userPolls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll? All votes will be lost.')) return;
    
    try {
      const response = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete poll');
      
      // Remove the deleted poll from the local state so it vanishes instantly from the screen
      setMyPolls(myPolls.filter(poll => poll.id !== pollId));
    } catch (err) {
      setError(err.message);
    }
  };

  // UI States
  if (!user) return <div className="login-prompt">Please log in to view your polls.</div>;
  if (loading) return <div className="loading-state">Loading your polls...</div>;
  if (error) return <div className="error-alert">{error}</div>;

  return (
    <div className="my-polls-container">
      <h2>My Polls</h2>
      
      {myPolls.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any polls yet.</p>
          <Link to="/polls/new" className="btn-primary">Create Your First Poll</Link>
        </div>
      ) : (
        <div className="poll-list">
          {myPolls.map(poll => (
            <div key={poll.id} className="my-poll-card">
              <div className="my-poll-info">
                <h3><Link to={`/polls/${poll.id}`}>{poll.title}</Link></h3>
                <p className="poll-meta">
                  {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'} • Created on {new Date(poll.created_at).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(poll.id)} 
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}