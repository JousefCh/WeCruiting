const router = require('express').Router();
const ctrl = require('../controllers/placementController');
const auth = require('../middleware/auth');

router.post('/analyze-company',            auth, ctrl.analyzeCompany);
router.post('/search-companies',           auth, ctrl.searchCompanies);
router.post('/find-emails',               auth, ctrl.findEmails);
router.post('/send',                       auth, ctrl.sendEmails);
router.post('/instantly/create-campaign',  auth, ctrl.instantlyCreateCampaign);

module.exports = router;
