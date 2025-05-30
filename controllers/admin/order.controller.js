const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const searchHelper= require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
// /order get
module.exports.index = async(req, res) => {
    try {
        // Khởi tạo điều kiện tìm kiếm
        let find = {};
        
        // Xử lý tìm kiếm
        const search = searchHelper(req);
        if(search.regex){
            find["userInfo.fullName"] = search.regex;
        }
        
        const count = await Order.countDocuments(find);
        
        // Phân trang
        const objectPagination = paginationHelper(req, count, 4);
        
        // Lấy danh sách đơn hàng với phân trang
        const orders = await Order.find(find)
            .sort({ createdAt: -1 })
            .limit(objectPagination.limitItems)
            .skip(objectPagination.skip);
        
        // Render trang danh sách
        res.render('admin/pages/order/index', {
            pageTitle: "Quản lý đơn hàng", // Sửa tiêu đề cho chính xác
            keyword: search.keyword,
            order: orders, // Giữ tên biến order để tương thích với template
            pagination: objectPagination
        });
    } catch (error) {
        console.error("Error in order.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách đơn hàng");
        res.redirect("/admin/dashboard");
    }
}
module.exports.detail= async(req, res) => {
    try{
        const id=req.params.id;
        const order = await Order.findOne({_id:id})
        for(const item of order.products){
            const product = await Product.findOne({_id: item.product_id});
            item.productInfo=product;
        }
        // console.log(order)
        res.render('admin/pages/order/detail',{
            pagaTitle: "Chi tiết đơn hàng",
            order: order
        })
    }catch (error) {
        console.error("Error in order.detail:", error);
        req.flash("error", "Có lỗi xảy ra khi tải chi tiết đơn hàng");
        res.redirect("/admin/order");
    }
}
module.exports.delete= async(req, res) => {
    try{
        const id=req.params.id;
        await Order.deleteOne({_id:id})
        req.flash('success', 'Xóa đơn hàng thành công!');
        res.redirect(`/admin/order`);
    }catch (error) {
        console.error("Error in order.delete:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa đơn hàng");
        res.redirect("/admin/order");
    }
}
module.exports.edit= async(req, res) => {
    try{
        const id=req.params.id;
        const order = await Order.findOne({_id:id})
        // console.log(order)
        res.render('admin/pages/order/edit',{
            pagaTitle: "Sửa đơn hàng",
            order: order
        })
    }catch (error) {
        console.error("Error in order.edit:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang sửa đơn hàng");
        res.redirect("/admin/order");
    }
}
module.exports.editPatch = async(req, res) => {
    try{
        const id = req.params.id;
        // console.log(req.body)
        await Order.updateOne(
            { _id: id },
            {
                $set: {
                    status: req.body.status,
                    'userInfo.fullName': req.body.fullName,
                    'userInfo.phone': req.body.phone,
                    'userInfo.address': req.body.address
                }
            }
        );
        req.flash('success', 'Cập nhật đơn hàng thành công!');
        res.redirect(`/admin/order`);
    }catch (error) {
        console.error("Error in order.editPatch:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật đơn hàng");
        res.redirect("/admin/order");
    }
}



// Thêm phương thức mới để thay đổi trạng thái
module.exports.changeStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.params.status;
        
        // Kiểm tra trạng thái hợp lệ
        if (status !== "ongoing" && status !== "finished") {
            req.flash("error", "Trạng thái không hợp lệ");
            return res.redirect("back");
        }
        
        // Cập nhật trạng thái đơn hàng
        await Order.updateOne({ _id: id }, { status: status });
        
        req.flash("success", "Thay đổi trạng thái đơn hàng thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error in order.changeStatus:", error);
        req.flash("error", "Có lỗi xảy ra khi thay đổi trạng thái đơn hàng");
        res.redirect("back");
    }
};