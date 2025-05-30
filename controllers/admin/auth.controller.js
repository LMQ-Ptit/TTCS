const md5=require('md5')
const Account = require('../../models/account.model');   


// /admin/auth/login get
module.exports.login=async(req, res) => {
    res.render('admin/pages/auth/login',{
        pagaTitle: "Đăng nhập",
    })
}

// /admin/auth/login post
module.exports.loginPost=async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const user = await Account.findOne({
        email: email,
        deleted: false
    });

    if (!user) {
        req.flash("error", "Email không tồn tại!");
        res.redirect("back");
        return;
    }
    if(md5(password) != user.password) {
        req.flash("error", "Mật khẩu không đúng!");
        res.redirect("back");
        return;
    }
    res.cookie("token",user.token)
    req.flash("success", "Đăng nhập thành công!");
    res.redirect('/admin/dashboard');
}

// /admin/auth/logout get
module.exports.logout=async(req, res) => {
    res.clearCookie("token");
    req.flash("success", "Đăng xuất thành công!");
    res.redirect('/admin/auth/login');
}
