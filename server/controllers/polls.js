import express from 'express';
import { getAll, getById, create, deletePoll, vote } from '../models/polls.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/polls - Get all polls
router.get('/', async (req, res) => {
  try {
    const polls = await getAll();
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Server error fetching polls' });
  }
});

// GET /api/polls/:id - Get a single poll
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || null; 
    const poll = await getById(req.params.id, userId);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Server error fetching poll' });
  }
});

// POST /api/polls - Create a new poll (Protected)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, allow_anonymous, options } = req.body;
    
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 options are required' });
    }

    const pollId = await create(title, description, allow_anonymous, req.user.id, options);
    res.status(201).json({ id: pollId, message: 'Poll created successfully' });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Server error creating poll' });
  }
});

// DELETE /api/polls/:id - Delete a poll (Protected)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const success = await deletePoll(req.params.id, req.user.id);
    if (!success) {
      return res.status(403).json({ error: 'Not authorized to delete this poll or it does not exist' });
    }
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Server error deleting poll' });
  }
});

// POST /api/polls/:id/vote - Vote on a poll (Conditionally Protected)
router.post('/:id/vote', async (req, res) => {
  try {
    const pollId = req.params.id;
    const { option_id } = req.body;
    const userId = req.user?.id || null;

    // 1. Check if the poll exists
    const poll = await getById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // 2. Check permissions for voting
    if (!poll.allow_anonymous && !userId) {
      return res.status(401).json({ error: 'You must be logged in to vote on this poll' });
    }

    // 3. Cast the vote
    try {
      await vote(pollId, option_id, userId);
      res.json({ message: 'Vote recorded successfully' });
    } catch (dbError) {
      // 23505 is the PostgreSQL error code for unique violation
      if (dbError.code === '23505') {
        return res.status(400).json({ error: 'You have already voted on this poll' });
      }
      throw dbError; 
    }

  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Server error recording vote' });
  }
});

export default router;