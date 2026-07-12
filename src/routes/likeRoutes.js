const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { likeArticle, unlikeArticle } = require('../controllers/likeController');

router.post('/:id/like', requireAuth, likeArticle);
router.delete('/:id/like', requireAuth, unlikeArticle);

module.exports = router;