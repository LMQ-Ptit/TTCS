
const ProductCategory = require("../../models/product_category.model");
const searchHelper= require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
// /admin/procuct-category get
module.exports.index=async (req, res) => {
    try{
        const find={
            deleted:false
        }
        const count = await ProductCategory.countDocuments(find)
        const objectPagination = paginationHelper(req,count,4)
        const search = searchHelper(req)
        if(search.regex){
            find.title=search.regex
        }
        const productCategories = await ProductCategory.find(find).limit(objectPagination.limitItems).skip(objectPagination.skip)
        
        // Lấy tất cả danh mục để tìm kiếm danh mục cha (không phân trang)
        const allCategories = await ProductCategory.find({deleted: false});
        
        res.render('admin/pages/product-category/index',{
            pagaTitle: "Trang Danh mục sản phẩm",
            productCategories:productCategories,
            allCategories: allCategories, // Thêm biến chứa tất cả danh mục
            keyword:search.keyword,
            pagination: objectPagination
        })
    }catch (error) {
        console.error("Error in product-category.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách danh mục sản phẩm");
        res.redirect("/admin/dashboard");
    }
}
// /admin/procuct-category/create get
module.exports.create=async (req, res) => {
    try{
        const find={
            deleted:false
        }
        function createTree(arr, parentId = "") {
            const tree = [];
            arr.forEach((item) => {
                if (item.parent_id === parentId) {
                    const newItem = item;
                    const children = createTree(arr, item.id);
                    if (children.length > 0) {
                        newItem.children = children;
                    }
                    tree.push(newItem);
                }
            });
            return tree;
        }
        const productCategories = await ProductCategory.find(find)
        const tree = createTree(productCategories)
        // console.log(tree)
        res.render('admin/pages/product-category/create',{
            pagaTitle: "Trang tạo danh mục sản phẩm",
            productCategories:tree
        })
    }catch (error) {
        console.error("Error in product-category.create:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang tạo danh mục sản phẩm");
        res.redirect("/admin/products-category");
    }
}

// /admin/procuct-category/create post
module.exports.createPost = async (req, res) => {
    try {
        // Xử lý position
        if (req.body.position == '') {
            const count = await ProductCategory.countDocuments();
            req.body.position = count + 1;
        } else {
            req.body.position = parseInt(req.body.position);
        }
        
        // Xử lý file upload
        if (req.file) {
            req.body.thumbnail = `/admin/images/${req.file.filename}`;
        }
        
        // Tạo và lưu danh mục
        const productCategory = new ProductCategory(req.body);
        await productCategory.save();
        
        req.flash('success', 'Thêm mới danh mục sản phẩm thành công!');
        res.redirect('/admin/products-category');
    } catch (error) {
        console.error("Error in product-category.createPost:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo danh mục sản phẩm");
        res.redirect("/admin/products-category/create");
    }
};
// /admin/procuct-category/delete/:id post
module.exports.deleteItem = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Lấy thông tin danh mục trước khi xóa
        const category = await ProductCategory.findById(id);
        
        // Cập nhật trạng thái (soft delete)
        await ProductCategory.updateOne({_id: id}, {
            deleted: true, 
            deletedAt: new Date()
        });
        
        // Xóa file ảnh liên kết
        if (category && category.thumbnail && category.thumbnail.startsWith('/admin/images/')) {
            try {
                const fileHelper = require("../../helpers/file.helper");
                fileHelper.deleteFile(category.thumbnail);
            } catch (error) {
                console.error("Error deleting category thumbnail:", error);
            }
        }
        
        req.flash('success', 'Xóa danh mục sản phẩm thành công!');
        res.redirect('back');
    } catch (error) {
        console.error("Error in product-category.deleteItem:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa danh mục sản phẩm");
        res.redirect("/admin/products-category");
    }
};

// /admin/procuct-category/detail/:id get
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        const productCategory = await ProductCategory.findOne({_id: id});
        if (!productCategory) {
            req.flash("error", "Không tìm thấy danh mục sản phẩm");
            return res.redirect("/admin/products-category");
        }

        // Khởi tạo parentCategory là null
        let parentCategory = null;
        
        // Chỉ tìm parentCategory nếu parent_id tồn tại và hợp lệ
        if (productCategory.parent_id && productCategory.parent_id !== "") {
            parentCategory = await ProductCategory.findOne({_id: productCategory.parent_id});
        }
        
        res.render('admin/pages/product-category/detail', {
            pagaTitle: "Trang chi tiết danh mục sản phẩm",
            productCategory: productCategory,
            parentCategory: parentCategory  // Truyền parentCategory vào view
        });
    } catch (error) {
        console.error("Lỗi khi xem chi tiết danh mục:", error);
        req.flash("error", "Có lỗi xảy ra khi xử lý yêu cầu");
        res.redirect("/admin/products-category");
    }
}

// /admin/procuct-category/edit/:id get
module.exports.edit = async (req, res) => {
    try{
        const id = req.params.id;
        const productCategory = await ProductCategory.findOne({_id: id});
        res.render('admin/pages/product-category/edit', {
            pagaTitle: "Trang sửa danh mục sản phẩm",
            productCategory: productCategory
        });
    }catch (error) {
        console.error("Error in product-category.edit:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang sửa danh mục sản phẩm");
        res.redirect("/admin/products-category");
    }
}

// /admin/procuct-category/edit/:id patch
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Lấy thông tin danh mục hiện tại
        const currentCategory = await ProductCategory.findById(id);
        
        // Xử lý file upload
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (currentCategory && currentCategory.thumbnail && 
                currentCategory.thumbnail.startsWith('/admin/images/')) {
                try {
                    const fileHelper = require("../../helpers/file.helper");
                    fileHelper.deleteFile(currentCategory.thumbnail);
                } catch (error) {
                    console.error("Error deleting old thumbnail:", error);
                }
            }
            
            // Cập nhật đường dẫn ảnh mới
            req.body.thumbnail = `/admin/images/${req.file.filename}`;
        }
        
        // Cập nhật danh mục
        await ProductCategory.updateOne({_id: id}, req.body);
        
        req.flash('success', 'Cập nhật danh mục sản phẩm thành công!');
        res.redirect('/admin/products-category');
    } catch (error) {
        console.error("Error in product-category.editPatch:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật danh mục sản phẩm");
        res.redirect("/admin/products-category");
    }
};
