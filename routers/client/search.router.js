const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const controller = require("../../controllers/client/search.controller");

// Cấu hình storage để lưu file vào thư mục yolov5/data/images
const uploadDir = path.join(__dirname, '../../yolov5_7/yolov5/data/images');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Đã tạo thư mục: ${uploadDir}`);
}

// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'search-' + uniqueSuffix + ext);
    }
});

// Lọc file - chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file hình ảnh (JPEG, PNG, WEBP)'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Routes
router.get("/", controller.index);
router.post("/image", upload.single('imageSearch'), controller.searchByImage);

module.exports = router;