const Product = require("../../models/product.model");
const ProductHelper = require("../../helpers/product");
const paginationHelper = require("../../helpers/pagination");
const ProductCategory = require("../../models/product_category.model");

// Hàm lấy tất cả ID danh mục con từ danh mục cha
const getAllChildCategoryIds = async (categoryId) => {
    const allCategoryIds = [categoryId];
    
    // Hàm đệ quy để tìm tất cả các danh mục con
    const findChildCategories = async (parentId) => {
        const childCategories = await ProductCategory.find({
            parent_id: parentId,
            deleted: false,
            status: "active"
        });
        
        for (const category of childCategories) {
            allCategoryIds.push(category._id.toString());
            // Tìm tiếp các danh mục con của danh mục con này
            await findChildCategories(category._id);
        }
    };
    
    await findChildCategories(categoryId);
    return allCategoryIds;
};

// Hàm tạo cây danh mục phân cấp
const createCategoryTree = (categories, parentId = "") => {
    const categoryTree = [];
    
    categories.forEach(category => {
        if (category.parent_id === parentId) {
            const children = createCategoryTree(categories, category._id.toString());
            
            if (children.length > 0) {
                category.children = children;
            }
            
            categoryTree.push(category);
        }
    });
    
    return categoryTree;
};
// /products get
module.exports.index = async (req, res) => {
    try {
        // ket noi voi database
        const find = {
            status: "active",
            deleted: false
        }
        
        if (req.query.product_category_id) {
            const categoryId = req.query.product_category_id;
            // Lấy tất cả ID danh mục con từ danh mục được chọn
            const categoryIds = await getAllChildCategoryIds(categoryId);
            
            // Sử dụng $in để tìm sản phẩm thuộc bất kỳ danh mục nào trong danh sách
            find.product_category_id = { $in: categoryIds };
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
        
        // Lấy danh sách danh mục để hiển thị bộ lọc
        const categories = await ProductCategory.find({ 
            deleted: false,
            status: "active" 
        });
        
        // Tạo cây danh mục phân cấp
        const categoryTree = createCategoryTree(categories);
        
        // Gọi hàm phân trang
        const count = await Product.countDocuments(find);
        const objectPagination = paginationHelper(req, count, 6);
        
        // Truy vấn sản phẩm với sắp xếp
        const products = await Product.find(find)
            .sort(sort)
            .limit(objectPagination.limitItems)
            .skip(objectPagination.skip);
        
        // Tính toán giá mới
        const Products = await ProductHelper.newPrice(products);
        
        res.render("client/pages/products/index", {
            pageTitle: "Danh sách sản phẩm",
            products: Products,
            pagination: objectPagination,
            productCategories: categoryTree,  // Truyền cây danh mục
            query: req.query.product_category_id,
            sortType: req.query.sort || "position" // Truyền loại sắp xếp vào view
        });
    } catch (error) {
        console.error("Error in products.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách sản phẩm");
        res.redirect("/");
    }
}

//products/detail get
module.exports.detail=async (req, res) => {
    try {
        const find={
            deleted: false,
            status: "active",
            slug: req.params.slug
        }
        
        const product = await Product.findOne(find);
        
        if(!product) {
            req.flash("error", "Không tìm thấy sản phẩm");
            return res.redirect("/products");
        }
        
        product.priceNew = (product.price * (100 - product.discountPercentage) / 100).toFixed(0);
        
        res.render("client/pages/products/detail", {
            pageTitle: product.title || "Chi tiết sản phẩm",
            product: product
        });
    } catch (error) {
        console.error("Lỗi tại products.detail:", error);
        req.flash("error", "Có lỗi xảy ra khi tải thông tin sản phẩm");
        res.redirect("/products");
    }
}