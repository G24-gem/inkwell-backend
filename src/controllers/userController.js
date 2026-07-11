const pool = require('../config/db');

// GET PUBLIC PROFILE
async function getProfile(req, res) {
  try {
    const { username } = req.params;

    const profile = await pool.query(
      `SELECT p.id, p.username, p.full_name, p.bio, p.avatar_url, p.created_at,
        COUNT(DISTINCT a.id) as article_count,
        COUNT(DISTINCT f.follower_id) as follower_count
       FROM profiles p
       LEFT JOIN articles a ON p.id = a.author_id AND a.status = 'published'
       LEFT JOIN follows f ON p.id = f.following_id
       WHERE p.username = $1
       GROUP BY p.id`,
      [username]
    );

    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const articles = await pool.query(
      `SELECT a.id, a.title, a.subtitle, a.slug,
        a.cover_image_url, a.reading_time, a.published_at,
        COUNT(l.id) as like_count
       FROM articles a
       LEFT JOIN likes l ON a.id = l.article_id
       WHERE a.author_id = $1 AND a.status = 'published'
       GROUP BY a.id
       ORDER BY a.published_at DESC`,
      [profile.rows[0].id]
    );

    res.status(200).json({
      profile: profile.rows[0],
      articles: articles.rows
    });
  } catch (err) {
    console.log('GET PROFILE ERROR:', err.message);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
}

// UPDATE OWN PROFILE
async function updateProfile(req, res) {
  try {
    const { full_name, bio, avatar_url } = req.body;
    const userId = req.userId;

    const result = await pool.query(
      `UPDATE profiles
       SET
         full_name = COALESCE($1, full_name),
         bio = COALESCE($2, bio),
         avatar_url = COALESCE($3, avatar_url),
         updated_at = now()
       WHERE id = $4
       RETURNING id, username, full_name, bio, avatar_url`,
      [full_name, bio, avatar_url, userId]
    );

    res.status(200).json({ profile: result.rows[0] });
  } catch (err) {
    console.log('UPDATE PROFILE ERROR:', err.message);
    res.status(500).json({ error: 'Could not update profile' });
  }
}

// FOLLOW A USER
async function followUser(req, res) {
  try {
    const { username } = req.params;
    const followerId = req.userId;

    const target = await pool.query(
      'SELECT id FROM profiles WHERE username = $1',
      [username]
    );

    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followingId = target.rows[0].id;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [followerId, followingId]
    );

    res.status(200).json({ message: `You are now following ${username}` });
  } catch (err) {
    console.log('FOLLOW ERROR:', err.message);
    res.status(500).json({ error: 'Could not follow user' });
  }
}

// UNFOLLOW A USER
async function unfollowUser(req, res) {
  try {
    const { username } = req.params;
    const followerId = req.userId;

    const target = await pool.query(
      'SELECT id FROM profiles WHERE username = $1',
      [username]
    );

    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followingId = target.rows[0].id;

    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    res.status(200).json({ message: `You unfollowed ${username}` });
  } catch (err) {
    console.log('UNFOLLOW ERROR:', err.message);
    res.status(500).json({ error: 'Could not unfollow user' });
  }
}

// GET USER DRAFTS (own drafts only)
async function getMyDrafts(req, res) {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT id, title, subtitle, cover_image_url,
        status, reading_time, created_at, updated_at
       FROM articles
       WHERE author_id = $1 AND status = 'draft'
       ORDER BY updated_at DESC`,
      [userId]
    );

    res.status(200).json({ drafts: result.rows });
  } catch (err) {
    console.log('DRAFTS ERROR:', err.message);
    res.status(500).json({ error: 'Could not fetch drafts' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getMyDrafts
};