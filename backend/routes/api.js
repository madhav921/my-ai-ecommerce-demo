const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const aiController = require('../controllers/aicontroller');

// Product Routes
router.get('/products', productController.getProducts);
router.post('/products', productController.addProduct);

// AI Routes
router.post('/ai/generate-content', aiController.generateContent);
router.post('/ai/chat', aiController.chatWithAI);

module.exports = router;