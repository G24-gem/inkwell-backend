const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getMyDrafts
} = require('../controllers/userController');

// Public routes
router.get('/:username', getProfile);

// Protected routes
router.patch('/profile', requireAuth, updateProfile);
router.get('/drafts/me', requireAuth, getMyDrafts);
router.post('/:username/follow', requireAuth, followUser);
router.delete('/:username/follow', requireAuth, unfollowUser);

module.exports = router;