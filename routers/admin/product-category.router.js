const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/product-category.controller");
const upload = require("../../middleware/upload");

// Routes với middleware upload
router.post('/create', upload.single('thumbnail'), controller.createPost);
router.patch('/edit/:id', upload.single('thumbnail'), controller.editPatch);

// Giữ nguyên các routes khác
router.get('/', controller.index);
router.get('/create', controller.create);
router.get('/delete/:id', controller.deleteItem);
router.get('/detail/:id', controller.detail);
router.get('/edit/:id', controller.edit);

module.exports = router;