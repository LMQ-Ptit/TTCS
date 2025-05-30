module.exports.requireAdmin = async (req, res, next) => {
    try {
        // Kiểm tra đã đăng nhập chưa
        if (!req.cookies.token) {
            res.redirect(`/admin/auth/login`);
            return;
        }
        
        // Lấy thông tin tài khoản
        const Account = require('../../models/account.model');
        const user = await Account.findOne({
            token: req.cookies.token,
            deleted: false
        });
        
        // Kiểm tra nếu không tồn tại hoặc không phải admin
        if (!user || user.role !== 'admin') {
            req.flash('error', 'Bạn không có quyền truy cập chức năng này!');
            res.redirect('/admin/dashboard');
            return;
        }
        
        next();
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra!');
        res.redirect('/admin/dashboard');
    }
};