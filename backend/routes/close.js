const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/closeController');
const auth = require('../middleware/auth');

router.get('/profile-number', auth, ctrl.getProfileNumber);
router.post('/send-to-close', auth, ctrl.sendToClose);
router.post('/generate-email', auth, ctrl.generateEmail);
router.post('/refine-email', auth, ctrl.refineEmail);
router.post('/tailor', auth, ctrl.tailorCV);

module.exports = router;
