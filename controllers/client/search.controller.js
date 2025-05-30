const Product = require("../../models/product.model");
const ProductHelper = require("../../helpers/product");
const paginationHelper = require("../../helpers/pagination");
// Thêm vào controller hiện có
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
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

module.exports.searchByImage = async (req, res) => {
    try {
        // Kiểm tra file upload
        if (!req.file) {
            req.flash("error", "Vui lòng chọn hình ảnh để tìm kiếm");
            return res.redirect("/search");
        }

        console.log("Đã nhận file:", req.file.path);
        
        // Đường dẫn đến script Python
        const pythonScript = path.join(__dirname, '../../yolov5_7/detect_objects.py');
        
        // Gọi script Python để phát hiện đối tượng trong ảnh
        const pythonProcess = spawn('python', [pythonScript, req.file.path]);
        
        let outputData = '';
        let errorData = '';
        
        // Thu thập output từ script Python
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });
        
        // Thu thập lỗi nếu có
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error("Python error:", data.toString());
        });
        
        // Xử lý kết quả khi script Python hoàn thành
        pythonProcess.on('close', async (code) => {
            try {
                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    throw new Error(`Lỗi khi phát hiện đối tượng (mã lỗi: ${code})`);
                }
                
                // Parse kết quả JSON
                const detectionResults = JSON.parse(outputData);
                
                // Kiểm tra nếu có lỗi từ Python
                if (detectionResults.error) {
                    throw new Error(`Lỗi phát hiện đối tượng: ${detectionResults.error}`);
                }
                
                // Kiểm tra nếu không phát hiện đối tượng nào
                if (detectionResults.length === 0) {
                    req.flash("warning", "Không phát hiện được đối tượng nào trong hình ảnh");
                    return res.redirect("/search");
                }
                
                // Lấy danh sách nhãn để tìm kiếm
                const labels = detectionResults.map(item => item.label);
                
                // Tạo từ khóa từ các nhãn (chỉ lấy tối đa 3 nhãn có độ tin cậy cao nhất)
                const keyword = labels.slice(0, 3).join(" ");
                console.log("Tìm kiếm với từ khóa:", keyword);
                
                // Chuyển hướng đến trang tìm kiếm với từ khóa là nhãn đã phát hiện
                res.redirect(`/search?keyword=${encodeURIComponent(keyword)}`);
                
            } catch (error) {
                console.error("Lỗi xử lý kết quả phát hiện đối tượng:", error);
                req.flash("error", error.message);
                res.redirect("/search");
            }
        });
    } catch (error) {
        console.error("Lỗi tại search.searchByImage:", error);
        req.flash("error", "Có lỗi xảy ra khi tìm kiếm bằng hình ảnh");
        res.redirect("/search");
    }
};