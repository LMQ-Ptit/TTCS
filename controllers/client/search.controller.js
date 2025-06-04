const Product = require("../../models/product.model");
const ProductHelper = require("../../helpers/product");
const paginationHelper = require("../../helpers/pagination");
// Thêm vào controller hiện có
const path = require('path');
const fs = require('fs');
const yoloDetector = require('../../yolov5_7/yolo-detector');
// Giả sử bạn đã cài đặt yolov5_7
module.exports.index = async(req, res) => {
    try {
        const keyword = req.query.keyword;
        let Products = [];
        
        if(keyword) {
            const keywordRegex = new RegExp(keyword, "i");
            // ket noi voi database
            const find = {
                status: "active",
                deleted: false,
                title: keywordRegex
            }
            
            // Xử lý sắp xếp
            let sort = { position: -1 }; // Mặc định sắp xếp theo vị trí
            
            if (req.query.sort) {
                switch (req.query.sort) {
                    case "position":
                        sort = { position: -1 };
                        break;
                    case "newest":
                        sort = { createdAt: -1 };
                        break;
                    case "price-asc":
                        sort = { price: 1 };
                        break;
                    case "price-desc":
                        sort = { price: -1 };
                        break;
                    case "name-asc":
                        sort = { title: 1 };
                        break;
                    case "name-desc":
                        sort = { title: -1 };
                        break;
                }
            }
            
            // Gọi hàm phân trang
            const count = await Product.countDocuments(find);
            const objectPagination = paginationHelper(req, count, 6);
            
            // Truy vấn sản phẩm với sắp xếp và phân trang
            const products = await Product.find(find)
                .sort(sort)
                .limit(objectPagination.limitItems)
                .skip(objectPagination.skip);
            
            // Tính toán giá mới
            Products = await ProductHelper.newPrice(products);
            
            res.render("client/pages/search/index", {
                pageTitle: "Kết quả tìm kiếm",
                keyword: keyword,
                products: Products,
                pagination: objectPagination,
                sortType: req.query.sort || "position"
            });
        } else {
            res.render("client/pages/search/index", {
                pageTitle: "Tìm kiếm",
                keyword: "",
                products: [],
                pagination: {
                    totalItems: 0,
                    limitItems: 6
                },
                sortType: "position"
            });
        }
    } catch (error) {
        console.error("Lỗi tại search.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tìm kiếm sản phẩm");
        res.redirect("/");
    }
}

// Cập nhật phương thức searchByImage
module.exports.searchByImage = async (req, res) => {
    try {
        // Kiểm tra file upload
        if (!req.file) {
            req.flash("error", "Vui lòng chọn hình ảnh để tìm kiếm");
            return res.redirect("/search");
        }

        console.log("Ảnh đã được tải lên:", req.file.path);
        
        // Đường dẫn đến thư mục chứa ảnh
        const imageDir = path.dirname(req.file.path);
        // Đường dẫn đến file weights
        const weightsPath = path.join(__dirname, '../../yolov5_7/yolov5/best.pt');
        
        try {
            // Gọi API để phát hiện đối tượng
            const result = await yoloDetector.detectObjectsInFolder(imageDir, weightsPath, 0.25);
            
            // Sau khi xử lý xong, xóa ảnh để giải phóng không gian
            try {
                fs.unlinkSync(req.file.path);
                console.log("Đã xóa file tạm:", req.file.path);
            } catch (err) {
                console.error("Lỗi khi xóa file:", err);
            }
            
            // Lấy các nhãn duy nhất để tìm kiếm
            const uniqueLabels = yoloDetector.getUniqueLabels(result);
            
            if (!uniqueLabels || uniqueLabels.length === 0) {
                req.flash("warning", "Không phát hiện được đối tượng nào trong hình ảnh");
                return res.redirect("/search");
            }
            
            // Chuyển đổi nhãn thành từ khóa tìm kiếm
            const keyword = yoloDetector.getLabelsString(result);
            console.log("Tìm kiếm với từ khóa:", keyword);
            
            // Chuyển hướng đến URL tìm kiếm với từ khóa phát hiện được
            res.redirect(`/search?keyword=${encodeURIComponent(keyword)}`);
            
        } catch (error) {
            console.error("Lỗi khi phát hiện đối tượng:", error);
            req.flash("error", "Có lỗi xảy ra khi phân tích hình ảnh");
            res.redirect("/search");
        }
        
    } catch (error) {
        console.error("Lỗi trong searchByImage:", error);
        req.flash("error", "Có lỗi xảy ra khi tìm kiếm bằng hình ảnh");
        res.redirect("/search");
    }
};