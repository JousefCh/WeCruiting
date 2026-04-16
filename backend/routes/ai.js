const express = require('express');
const router = express.Router();
const aiCtrl = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.post('/cover-letter', aiCtrl.generateCoverLetter);

module.exports = router;
