const User = require("../../models/user.model")
const md5= require("md5")
const generate=require('../../helpers/ganerate')
// /user/register
module.exports.register = async (req, res) => {
    try{
        res.render("client/pages/user/register", {
            pageTitle: "Đăng ký"
        })
    }catch(error){
        console.log("Lỗi khi tải trang đăng ký:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang đăng ký");
        res.redirect("/");
    }
}

// /user/register POST
module.exports.registerPost = async (req, res) => {
    try{
        // Kiểm tra các trường bắt buộc
        const { fullName, email, password } = req.body;
        
        if (!fullName || !email || !password) {
            req.flash("error", "Vui lòng nhập đầy đủ thông tin (họ tên, email và mật khẩu)");
            res.redirect("back");
            return;
        }
        
        const existUser = await User.findOne({
            email: email,
            deleted: false
        })
        if(existUser){
            req.flash("error", "Email đã tồn tại");
            res.redirect("back");
            return;
        }
        
        req.body.password = md5(password);
        req.body.tokenUser = generate.generateRandomString(20);
        const user = new User(req.body);
        await user.save();
        res.cookie("tokenUser", user.tokenUser);
        req.flash("success", "Đăng ký thành công");
        res.redirect("/");
    }catch(error){
        console.log("Lỗi khi đăng ký:", error);
        req.flash("error", "Có lỗi xảy ra khi đăng ký tài khoản");
        res.redirect("/user/register");
    }
}

// /user/login GET
module.exports.login = async (req, res) => {
    try{
        res.render("client/pages/user/login", {
            pageTitle: "Đăng ký"
        })
    }catch(error){
        console.log("Lỗi khi tải trang đăng nhập:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang đăng nhập");
        res.redirect("/");
    }
}

// /user/login POST
module.exports.loginPost = async (req, res) => {
    try{
        const email=req.body.email
        const password=req.body.password
        const user=await User.findOne({
            email:email,
            deleted:false
        })
        if(!user){
            req.flash("error", "Email không tồn tại")
            res.redirect("back")
            return
        }
        if(md5(password)!==user.password){
            req.flash("error", "Mật khẩu không đúng")
            res.redirect("back")
            return
        }
        if(user.status=="inactive"){
            req.flash("error", "Tài khoản chưa kích hoạt")
            res.redirect("back")
            return
        }
        // console.log(user)
        res.cookie("tokenUser",user.tokenUser)
        req.flash("success", "Đăng nhập thành công")
        res.redirect("/")
    }catch(error){
        console.log("Lỗi khi đăng nhập:", error);
        req.flash("error", "Có lỗi xảy ra khi đăng nhập");
        res.redirect("/user/login");
    }
}

// /user/logout GET
module.exports.logout = async (req, res) => {
    try{
        res.clearCookie("tokenUser")
        req.flash("success", "Đăng xuất thành công")
        res.redirect("/")
    }catch(error){
        console.log("Lỗi khi đăng xuất:", error);
        req.flash("error", "Có lỗi xảy ra khi đăng xuất");
        res.redirect("/");
    }
}

// /user/info GET
module.exports.info = async (req, res) => {
    try{
        res.render("client/pages/user/info", {
            pageTitle: "Thông tin tài khoản"
        })
    }catch(error){
        console.log("Lỗi khi tải trang thông tin tài khoản:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang thông tin tài khoản");
        res.redirect("/user/login");
    }
}
// /user/edit GET
module.exports.edit = async (req, res) => {
    try{
        res.render("client/pages/user/edit", {
            pageTitle: "Thông tin tài khoản"
        })
    }catch(error){
        console.log("Lỗi khi tải trang chỉnh sửa thông tin tài khoản:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang chỉnh sửa thông tin tài khoản");
        res.redirect("/user/login");
    }
}

// /user/edit PATCH 
module.exports.editPatch = async (req, res) => {
    
    try {
        // Kiểm tra đăng nhập
        const tokenUser = req.cookies.tokenUser;
        if (!tokenUser) {
            req.flash("error", "Vui lòng đăng nhập để thực hiện chức năng này");
            return res.redirect("/user/login");
        }
        
        // Tìm người dùng theo token
        const user = await User.findOne({
            tokenUser: tokenUser,
            deleted: false
        });
        
        if (!user) {
            req.flash("error", "Người dùng không tồn tại");
            return res.redirect("/user/login");
        }
        
        // Lấy dữ liệu từ form
        const { fullName, email, phone, avatar } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!fullName) {
            req.flash("error", "Họ tên không được để trống");
            return res.redirect("back");
        }
        
        // Chuẩn bị dữ liệu cập nhật
        const updateData = {
            fullName: fullName,
            phone: phone || ""
        };
        
        // Xử lý URL ảnh đại diện
        if (avatar && avatar.trim()) {
            // Kiểm tra URL hợp lệ
            const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
            if (!urlPattern.test(avatar.trim())) {
                req.flash("error", "URL hình ảnh không hợp lệ");
                return res.redirect("back");
            }
            updateData.avatar = avatar.trim();
        }
        
        // Xử lý email (chỉ nếu tài khoản chưa được kích hoạt)
        if (user.status !== "active" && email !== user.email) {
            // Kiểm tra email đã tồn tại chưa
            const emailExists = await User.findOne({ 
                email: email, 
                deleted: false,
                _id: { $ne: user._id } 
            });
            
            if (emailExists) {
                req.flash("error", "Email đã được sử dụng bởi tài khoản khác");
                return res.redirect("back");
            }
            
            updateData.email = email;
        }
        
        // Cập nhật thông tin người dùng
        await User.updateOne({ tokenUser: tokenUser }, updateData);
        
        req.flash("success", "Cập nhật thông tin thành công");
        res.redirect("/user/info");
        
    } catch (error) {
        console.error("Error updating user info:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật thông tin");
        res.redirect("back");
    }
};