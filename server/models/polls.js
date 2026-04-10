import db from '../db/connection.js';

// Get all polls with vote counts
export async function getAll() {
  const query = `
    SELECT p.id, p.title, p.allow_anonymous, p.created_at, 
           u.username as creator_username, 
           COUNT(v.id)::int as total_votes
    FROM polls p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN votes v ON p.id = v.poll_id
    GROUP BY p.id, u.username
    ORDER BY p.created_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

// Get a single poll, its options, and the user's vote
export async function getById(pollId, userId = null) {
  // 1. Get poll details
  const pollQuery = `
    SELECT p.*, u.username as creator_username 
    FROM polls p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.id = $1
  `;
  const { rows: pollRows } = await db.query(pollQuery, [pollId]);
  
  if (pollRows.length === 0) return null;
  const poll = pollRows[0];

  // 2. Get options with vote counts
  const optionsQuery = `
    SELECT o.id, o.text, COUNT(v.id)::int as vote_count
    FROM options o
    LEFT JOIN votes v ON o.id = v.option_id
    WHERE o.poll_id = $1
    GROUP BY o.id
    ORDER BY o.id ASC
  `;
  const { rows: options } = await db.query(optionsQuery, [pollId]);
  poll.options = options;

  // 3. Get the current user's vote (if logged in)
  poll.userVote = null;
  if (userId) {
    const voteQuery = `SELECT option_id FROM votes WHERE poll_id = $1 AND user_id = $2`;
    const { rows: voteRows } = await db.query(voteQuery, [pollId, userId]);
    if (voteRows.length > 0) {
      poll.userVote = voteRows[0].option_id;
    }
  }

  return poll;
}

// Create a new poll and its options
export async function create(title, description, allowAnonymous, userId, options) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Insert poll
    const pollQuery = `
      INSERT INTO polls (title, description, allow_anonymous, user_id)
      VALUES ($1, $2, $3, $4) RETURNING id
    `;
    const { rows: pollRows } = await client.query(pollQuery, [title, description, allowAnonymous, userId]);
    const pollId = pollRows[0].id;

    // Insert options
    const optionQuery = `INSERT INTO options (poll_id, text) VALUES ($1, $2)`;
    for (const text of options) {
      await client.query(optionQuery, [pollId, text]);
    }

    await client.query('COMMIT');
    return pollId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Delete a poll (only if user owns it)
export async function deletePoll(pollId, userId) {
  const query = `DELETE FROM polls WHERE id = $1 AND user_id = $2 RETURNING id`;
  const { rows } = await db.query(query, [pollId, userId]);
  return rows.length > 0;
}

// Cast a vote
export async function vote(pollId, optionId, userId) {
  const query = `
    INSERT INTO votes (poll_id, option_id, user_id)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  await db.query(query, [pollId, optionId, userId]);
}