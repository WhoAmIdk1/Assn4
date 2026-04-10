import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch('/api/polls');
        if (!response.ok) throw new Error('Failed to fetch polls');
        
        const data = await response.json();
        setPolls(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  if (loading) return <div className="loading-state">Loading polls...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>Browse Polls</h1>
        <p>See what the community is voting on.</p>
      </header>

      {polls.length === 0 ? (
        <div className="empty-state">
          <p>No polls have been created yet. Be the first!</p>
          <Link to="/polls/new" className="btn-primary">Create a Poll</Link>
        </div>
      ) : (
        <div className="poll-grid">
          {polls.map((poll) => (
            <Link to={`/polls/${poll.id}`} key={poll.id} className="poll-card-link">
              <div className="poll-card">
                <h2 className="poll-title">{poll.title}</h2>
                
                <div className="poll-meta">
                  <span className="poll-creator">Asked by {poll.creator_username}</span>
                  <span className="poll-votes">
                    {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                
                {poll.allow_anonymous && (
                  <span className="badge anonymous-badge">Anonymous Voting Allowed</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}