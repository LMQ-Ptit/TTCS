const Account = require("../../models/account.model");

module.exports.requireAuth = async (req, res, next) => {
    if (!req.cookies.token) {
        res.redirect(`/admin/auth/login`);
        return;
    }

    // Lấy thông tin người dùng từ token
    try {
        const Account = require("../../models/account.model");
        const user = await Account.findOne({
            token: req.cookies.token,
            deleted: false
        });

        if (!user) {
            res.redirect(`/admin/auth/login`);
            return;
        }

        // Lưu thông tin user vào res.locals để sử dụng trong view
        res.locals.user = user;
        
        // Tạo global để sử dụng trong controller
        req.user = user;

        next();
    } catch (error) {
        res.redirect(`/admin/auth/login`);
    }
};