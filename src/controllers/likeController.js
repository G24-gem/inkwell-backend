const pool = require('../config/db');

// LIKE AN ARTICLE
async function likeArticle(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await pool.query(
      `INSERT INTO likes (user_id, article_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, id]
    );

    const count = await pool.query(
      'SELECT COUNT(*) as like_count FROM likes WHERE article_id = $1',
      [id]
    );

    res.status(200).json({
      message: 'Article liked',
      like_count: count.rows[0].like_count
    });
  } catch (err) {
    console.log('LIKE ERROR:', err.message);
    res.status(500).json({ error: 'Could not like article' });
  }
}

// UNLIKE AN ARTICLE
async function unlikeArticle(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND article_id = $2',
      [userId, id]
    );

    const count = await pool.query(
      'SELECT COUNT(*) as like_count FROM likes WHERE article_id = $1',
      [id]
    );

    res.status(200).json({
      message: 'Article unliked',
      like_count: count.rows[0].like_count
    });
  } catch (err) {
    console.log('UNLIKE ERROR:', err.message);
    res.status(500).json({ error: 'Could not unlike article' });
  }
}

module.exports = { likeArticle, unlikeArticle };