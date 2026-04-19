const express = require('express');
const router = express.Router();
const aiCtrl = require('../controllers/aiController');
const linkedinCtrl = require('../controllers/linkedinController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.post('/cover-letter', aiCtrl.generateCoverLetter);
router.post('/linkedin-import', linkedinCtrl.parseLinkedInProfile);

module.exports = router;
