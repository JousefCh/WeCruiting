const express = require('express');
const router = express.Router();
const cvCtrl = require('../controllers/cvController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', cvCtrl.list);
router.post('/', cvCtrl.create);
router.get('/:id', cvCtrl.getOne);
router.put('/:id', cvCtrl.update);
router.delete('/:id', cvCtrl.remove);

module.exports = router;
