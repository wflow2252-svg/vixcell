const express = require('express')
const router = express.Router()
const metaController = require('../controllers/meta.controller')

// Webhook verification endpoint (GET)
router.get('/webhook', metaController.verifyWebhook)

// Webhook event receiver (POST)
router.post('/webhook', metaController.handleWebhook)

module.exports = router
