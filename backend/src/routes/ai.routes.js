const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  message: { success: false, message: 'Too many demo requests. Try again later.' }
});

router.post('/generate-demo', aiLimiter, aiController.generateDemo);
router.get('/demos', protect, aiController.getDemos);
router.get('/demos/:id', aiController.getDemoHtml);

module.exports = router;
