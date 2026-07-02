const pool = require('../config/db');

// CREATE DRAFT
async function createArticle(req, res) {
  try {
    const { title } = req.body;
    const authorId = req.userId;

    const result = await pool.query(
      `INSERT INTO articles (author_id, title, blocks, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING *`,
      [authorId, title || 'Untitled', '[]']
    );

    res.status(201).json({ article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create article' });
  }
}

// GET ALL PUBLISHED ARTICLES (FEED)
async function getArticles(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        a.id, a.title, a.subtitle, a.slug,
        a.cover_image_url, a.reading_time, a.published_at,
        p.username, p.full_name, p.avatar_url,
        COUNT(l.id) as like_count
       FROM articles a
       JOIN profiles p ON a.author_id = p.id
       LEFT JOIN likes l ON a.id = l.article_id
       WHERE a.status = 'published' AND a.visibility = 'public'
       GROUP BY a.id, p.id
       ORDER BY a.published_at DESC`,
    );

    res.status(200).json({ articles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch articles' });
  }
}

// GET SINGLE ARTICLE BY SLUG
async function getArticleBySlug(req, res) {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT
        a.*,
        p.username, p.full_name, p.avatar_url,
        COUNT(l.id) as like_count
       FROM articles a
       JOIN profiles p ON a.author_id = p.id
       LEFT JOIN likes l ON a.id = l.article_id
       WHERE a.slug = $1
       AND a.status = 'published'
       GROUP BY a.id, p.id`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch article' });
  }
}

// UPDATE DRAFT (AUTO-SAVE)
async function updateArticle(req, res) {
  try {
    const { id } = req.params;
    const { title, subtitle, blocks, cover_image_url } = req.body;
    const authorId = req.userId;

    const result = await pool.query(
  `UPDATE articles
   SET
     title = COALESCE($1, title),
     subtitle = COALESCE($2, subtitle),
     blocks = COALESCE($3::jsonb, blocks),
     cover_image_url = COALESCE($4, cover_image_url),
     updated_at = now()
   WHERE id = $5 AND author_id = $6
   RETURNING *`,
  [
    title,
    subtitle,
    blocks ? JSON.stringify(blocks) : null,
    cover_image_url,
    id,
    authorId
  ]
);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found or unauthorized' });
    }

    res.status(200).json({ article: result.rows[0] });
} catch (err) {
    console.log('UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Could not update article' });
  }
}

// PUBLISH ARTICLE
async function publishArticle(req, res) {
  try {
    const { id } = req.params;
    const { subtitle, cover_image_url, visibility } = req.body;
    const authorId = req.userId;

    // Fetch the article first
    const existing = await pool.query(
      'SELECT * FROM articles WHERE id = $1 AND author_id = $2',
      [id, authorId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found or unauthorized' });
    }

    const article = existing.rows[0];

    // Generate slug from title
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Estimate reading time
    const plainText = JSON.stringify(article.blocks);
    const wordCount = plainText.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200);

    const result = await pool.query(
      `UPDATE articles
       SET
         status = 'published',
         slug = $1,
         subtitle = COALESCE($2, subtitle),
         cover_image_url = COALESCE($3, cover_image_url),
         visibility = COALESCE($4, visibility),
         reading_time = $5,
         published_at = now(),
         updated_at = now()
       WHERE id = $6 AND author_id = $7
       RETURNING *`,
      [slug, subtitle, cover_image_url, visibility, readingTime, id, authorId]
    );

    res.status(200).json({ article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not publish article' });
  }
}

// DELETE ARTICLE
async function deleteArticle(req, res) {
  try {
    const { id } = req.params;
    const authorId = req.userId;

    const result = await pool.query(
      'DELETE FROM articles WHERE id = $1 AND author_id = $2 RETURNING id',
      [id, authorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found or unauthorized' });
    }

    res.status(200).json({ message: 'Article deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete article' });
  }
}

module.exports = {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  publishArticle,
  deleteArticle
};
