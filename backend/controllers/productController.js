const Product = require('../models/productModel');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

// Add a new product
exports.addProduct = async (req, res) => {
    const { name, title, description, imageUrl } = req.body;
    try {
        const newProduct = new Product({ name, title, description, imageUrl });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error });
    }
};