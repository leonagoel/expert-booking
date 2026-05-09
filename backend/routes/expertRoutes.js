const express = require('express');
const router = express.Router();
const { getExperts, getExpertById, getCategories } = require('../controllers/expertController');

router.get('/categories', getCategories);
router.get('/', getExperts);
router.get('/:id', getExpertById);

module.exports = router;
