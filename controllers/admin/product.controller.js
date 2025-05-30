const ProductCategory = require("../../models/product_category.model");
const fileHelper = require("../../helpers/file.helper");
const Product = require("../../models/product.model");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper= require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
// /admin/procuct get
module.exports.index=async (req, res) => {
    try{
        //Tạo biến find để truy vấn dữ liệu
        let find={
            deleted:false
        }
        // truy van theo status va them status vao find
        if(req.query.status){
            find.status=req.query.status
        }
        //sort
        let sort = {}
        if(req.query.sortKey && req.query.sortValue){
            sort[req.query.sortKey] = req.query.sortValue
        }else{
            sort.position = 'desc'
        }

        //Gọi hàm filterStatusHelper
        const filterStatus = filterStatusHelper(req)
        //End Gọi hàm filterStatusHelper

        //Gọi hàm searchHelper
        const search = searchHelper(req)
        if(search.regex){
            find.title=search.regex
        }
        //End Gọi hàm searchHelper

        //Goi ham paginationHelper
        const count = await Product.countDocuments(find)
        const objectPagination = paginationHelper(req,count,4)
        //end Goi ham paginationHelper

        //in ra moi trang 
        const products = await Product.find(find).sort(sort).limit(objectPagination.limitItems).skip(objectPagination.skip)
        // console.log(req.query.status)
        // console.log(products)
        res.render('admin/pages/product/index',{
            pagaTitle: "Trang san pham",
            products: products,
            filterStatus:filterStatus ,
            keyword:search.keyword,
            pagination: objectPagination
        })
    }catch (error) {
        console.error("Error in product.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách sản phẩm");
        res.redirect("/admin/dashboard");
    }
}

// /admin/products/change-status/:status/:id get
module.exports.changeStatus=async (req, res) => {
    try{
        const statu=req.params.status;
        const id=req.params.id;
        await Product.updateOne({_id:id},{status:statu});
        req.flash('success', 'Thay đổi trạng thái thành công')
        res.redirect('back')
    }catch(err){
        console.log(err)
        req.flash('error', 'Thay đổi trạng thái thất bại')
        res.redirect('back')
    }
}

// Phiên bản xóa hoàn toàn (thay thế phương thức deleteItem nếu muốn)
module.exports.deleteItem = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Lấy thông tin sản phẩm trước khi xóa
        const product = await Product.findById(id);
        
        // Xóa sản phẩm khỏi database
        await Product.deleteOne({_id: id});
        
        // Xóa file ảnh liên kết
        if (product && product.thumbnail && product.thumbnail.startsWith('/admin/images/')) {
            fileHelper.deleteFile(product.thumbnail);
        }
        
        req.flash('success', 'Xóa sản phẩm thành công');
        res.redirect('back');
    } catch (error) {
        console.error("Error in product.deleteItem:", error);
        req.flash('error', 'Xóa sản phẩm thất bại');
        res.redirect('back');
    }
};

// /admin/products/create get
module.exports.create= async(req, res) => {
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
        res.render('admin/pages/product/create',{
            pagaTitle: "Trang tao san pham"
            ,productCategories:tree
        })
    }catch (error) {
        console.error("Error in product.create:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang tạo sản phẩm");
        res.redirect("/admin/products");
    }
}

// Trong phương thức createPost
module.exports.createPost = async (req, res) => {
    try {
        // Kiểm tra các trường bắt buộc
        const requiredFields = ["title", "price", "stock", "product_category_id"];
        const errors = [];
        
        for (const field of requiredFields) {
            if (!req.body[field]) {
                errors.push(`Trường ${field} không được để trống`);
            }
        }
        
        // Kiểm tra giá trị số hợp lệ
        if (req.body.price && (isNaN(req.body.price) || parseInt(req.body.price) < 0)) {
            errors.push("Giá phải là số dương");
        }
        
        if (req.body.stock && (isNaN(req.body.stock) || parseInt(req.body.stock) < 0)) {
            errors.push("Số lượng phải là số dương");
        }
        
        if (req.body.discountPercentage && (isNaN(req.body.discountPercentage) || parseInt(req.body.discountPercentage) < 0 || parseInt(req.body.discountPercentage) > 100)) {
            errors.push("Phần trăm giảm giá phải là số từ 0-100");
        }
        
        // Nếu có lỗi, quay lại form với thông báo
        if (errors.length > 0) {
            // Lấy lại danh mục để hiển thị trong form
            const find = { deleted: false };
            function createTree(arr, parentId = "") {
                const tree = [];
                arr.forEach(item => {
                    if (item.parent_id === parentId) {
                        const newItem = {
                            _id: item._id,
                            title: item.title,
                            children: createTree(arr, item._id.toString())
                        };
                        tree.push(newItem);
                    }
                });
                return tree;
            }
            const productCategories = await ProductCategory.find(find);
            const tree = createTree(productCategories);
            
            req.flash('error', errors.join(', '));
            return res.render('admin/pages/product/create', {
                pagaTitle: "Trang tạo sản phẩm",
                productCategories: tree,
                errors: errors,
                product: req.body // Giữ lại các giá trị đã nhập
            });
        }

        // Xử lý các trường dữ liệu
        req.body.price = parseInt(req.body.price) || 0;
        req.body.discountPercentage = parseInt(req.body.discountPercentage) || 0;
        req.body.stock = parseInt(req.body.stock) || 0;
        
        // Xử lý file upload
        if (req.file) {
            // Lưu đường dẫn tương đối để sử dụng trong website
            req.body.thumbnail = `/admin/images/${req.file.filename}`;
        }
        
        // Xử lý position
        if (req.body.position == "") {
            const countProducts = await Product.countDocuments();
            req.body.position = countProducts + 1;
        } else {
            req.body.position = parseInt(req.body.position);
        }
        
        // Tạo sản phẩm
        const product = new Product(req.body);
        await product.save();
        
        req.flash('success', 'Tạo sản phẩm thành công');
        res.redirect('/admin/products/create');
    } catch (error) {
        console.error("Error in product.createPost:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo sản phẩm");
        res.redirect("/admin/products/create");
    }
};

// /admin/products/edit/:id get
module.exports.edit=async (req, res) => {
    try{
        const find={
            deleted:false,
            _id:req.params.id
        }
        const product=await Product.findOne(find);
        // console.log(product)
        res.render('admin/pages/product/edit',{
            pagaTitle: "Chinh sua san pham",
            product:product
        })
    }catch (error) {
        console.error("Error in product.edit:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang sửa sản phẩm");
        res.redirect("/admin/products");
    }
}

// Cập nhật phương thức editPatch để xóa ảnh cũ khi upload ảnh mới
module.exports.editPatch = async (req, res) => {
    try {
        // Xử lý các trường dữ liệu
        req.body.price = parseInt(req.body.price) || 0;
        req.body.discountPercentage = parseInt(req.body.discountPercentage) || 0;
        req.body.stock = parseInt(req.body.stock) || 0;
        req.body.position = parseInt(req.body.position) || 0;
        
        // Lấy thông tin sản phẩm hiện tại để lấy đường dẫn ảnh cũ
        const currentProduct = await Product.findById(req.params.id);
        
        // Xử lý file upload
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (currentProduct && currentProduct.thumbnail && 
                currentProduct.thumbnail.startsWith('/admin/images/')) {
                // Xóa file cũ
                fileHelper.deleteFile(currentProduct.thumbnail);
            }
            
            // Cập nhật đường dẫn mới
            req.body.thumbnail = `/admin/images/${req.file.filename}`;
        }
        
        // Cập nhật sản phẩm trong database
        await Product.updateOne({_id: req.params.id}, req.body);
        
        req.flash('success', 'Chỉnh sửa sản phẩm thành công');
        res.redirect('back');
    } catch (error) {
        console.error("Error in product.editPatch:", error);
        req.flash("error", "Có lỗi xảy ra khi chỉnh sửa sản phẩm");
        res.redirect("/admin/products");
    }
};

// /admin/products/detail/:id get
module.exports.detail=async (req, res) => {
    try{
        const find={
            deleted:false,
            _id:req.params.id
        }
        const product=await Product.findOne(find);
        
        // Lấy thông tin danh mục
        let categoryInfo = null;
        if (product.product_category_id) {
            categoryInfo = await ProductCategory.findOne({
                _id: product.product_category_id,
                deleted: false
            });
        }
        
        res.render('admin/pages/product/detail',{
            pagaTitle:product.title,
            product:product,
            categoryInfo: categoryInfo
        })
    }catch (error) {
        console.error("Error in product.detail:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang chi tiết sản phẩm");
        res.redirect("/admin/products");
    }
}
