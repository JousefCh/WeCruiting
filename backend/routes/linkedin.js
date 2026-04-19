const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { parseLinkedInProfile } = require('../controllers/linkedinController');

router.post('/parse', authMiddleware, parseLinkedInProfile);

module.exports = router;
