const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/product.controller");
const upload = require("../../middleware/upload");

// Thêm middleware upload vào routes
router.post('/create', upload.single('thumbnail'), controller.createPost);
router.patch('/edit/:id', upload.single('thumbnail'), controller.editPatch);

// Giữ nguyên các routes khác
router.get('/', controller.index);
router.get('/create', controller.create);
router.get('/edit/:id', controller.edit);
router.patch('/change-status/:status/:id', controller.changeStatus);
router.delete('/delete/:id', controller.deleteItem);
router.get('/detail/:id', controller.detail);

module.exports = router;