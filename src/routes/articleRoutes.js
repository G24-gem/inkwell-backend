const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  publishArticle,
  deleteArticle
} = require('../controllers/articleController');

// Public routes — no auth needed
router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

// Protected routes — auth required
router.post('/', requireAuth, createArticle);
router.patch('/:id', requireAuth, updateArticle);
router.post('/:id/publish', requireAuth, publishArticle);
router.delete('/:id', requireAuth, deleteArticle);

module.exports = router;
