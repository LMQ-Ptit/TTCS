const md5=require('md5')
const Account = require('../../models/account.model');   
const User = require("../../models/user.model")
const searchHelper= require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
// /admin/user get
module.exports.index=async(req, res) => {
    try{
        let find ={
            deleted:false
        }
        //Goi ham paginationHelper
        const count = await User.countDocuments(find)
        const objectPagination = paginationHelper(req,count,4)
        //end Goi ham paginationHelper
    
        //Gọi hàm searchHelper
            const search = searchHelper(req)
            if(search.regex){
                find.fullName=search.regex
        }
        //End Gọi hàm searchHelper
        const records = await User.find(find).limit(objectPagination.limitItems).skip(objectPagination.skip)
        // console.log(records)
        res.render('admin/pages/user/index',{
            pagaTitle: "Danh sach tài khoản người dùng",
            keyword:search.keyword,
            records: records,
            pagination: objectPagination
        })
    }catch (error) {
        console.error("Error in product.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách sản phẩm");
        res.redirect("/admin/dashboard");
    }
}
// admin/users/edit/:id get
module.exports.edit= async (req, res) => {
    try{
        const find={
            deleted:false,
            _id:req.params.id
        }
        const records=await User.findOne(find)
        // console.log(product)
        res.render('admin/pages/user/edit',{
            pagaTitle: "Chinh sua san pham ",
            records:records
        })
    }catch(err){
        console.log(err)
    }
}
// admin/users/edit/:id patch
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Tìm thông tin người dùng hiện tại
        const user = await User.findById(id);
        
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('/admin/user');
        }
        
        // Xử lý các trường dữ liệu
        const updateData = {...req.body};
        
        // Xử lý mật khẩu nếu được cung cấp
        if (updateData.password) {
            updateData.password = md5(updateData.password);
        } else {
            delete updateData.password;
        }
        
        // Xử lý file ảnh đại diện nếu có
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (user.avatar && user.avatar.startsWith('/admin/images/')) {
                try {
                    const fileHelper = require("../../helpers/file.helper");
                    fileHelper.deleteFile(user.avatar);
                } catch (error) {
                    console.error("Lỗi khi xóa ảnh cũ:", error);
                }
            }
            
            // Cập nhật đường dẫn ảnh mới
            updateData.avatar = `/admin/images/${req.file.filename}`;
        }
        
        // Cập nhật thông tin người dùng
        await User.updateOne({_id: id}, updateData);
        
        req.flash('success', 'Cập nhật thành công');
        res.redirect('/admin/user');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Cập nhật thất bại');
        res.redirect('back');
    }
}
// /admin/user/delete/:id get
module.exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Tìm thông tin người dùng trước khi xóa
        const user = await User.findById(id);
        
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('back');
        }
        
        // Xóa file ảnh đại diện nếu có
        if (user.avatar && user.avatar.startsWith('/admin/images/')) {
            try {
                const fileHelper = require("../../helpers/file.helper");
                fileHelper.deleteFile(user.avatar);
                console.log('Đã xóa file ảnh:', user.avatar);
            } catch (error) {
                console.error('Lỗi khi xóa file ảnh:', error);
                // Vẫn tiếp tục xóa người dùng
            }
        }
        
        // Xóa cứng người dùng khỏi database
        await User.deleteOne({_id: id});
        
        req.flash('success', 'Xóa người dùng thành công');
        res.redirect('back');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Xóa người dùng thất bại');
        res.redirect('back');
    }
}

// /admin/user/detail get
module.exports.detail=async (req, res) => {
    try{
        const user=await User.findOne({_id:req.params.id})
        // console.log(user)
        res.render('admin/pages/user/detail',{
            pagaTitle: "Chi tiết người dùng",
            user:user
        })
    }catch (error) {
        console.error("Error in product.detail:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang chi tiết sản phẩm");
        res.redirect("/admin/user");
    }
}

// /admin/user/change-status/:status/:id post
module.exports.changeStatus = async (req, res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;

        // Kiểm tra trạng thái hợp lệ
        if (status !== "active" && status !== "inactive") {
            req.flash("error", "Trạng thái không hợp lệ");
            return res.redirect("back");
        }

        // Cập nhật trạng thái người dùng
        await User.updateOne({ _id: id }, { status: status });

        req.flash("success", "Thay đổi trạng thái người dùng thành công");
        res.redirect("back");
    } catch (error) {
        console.error("Error in user.changeStatus:", error);
        req.flash("error", "Có lỗi xảy ra khi thay đổi trạng thái người dùng");
        res.redirect("back");
    }
};