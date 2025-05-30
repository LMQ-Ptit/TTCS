const md5=require('md5')
const Account = require('../../models/account.model');   
const searchHelper= require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const generateToken = require("../../helpers/ganerate");
module.exports.index = async (req, res) => {
    try {
        // Xây dựng điều kiện tìm kiếm cơ bản
        let find = {
            deleted: false
        };
        
        // Tìm kiếm theo từ khóa
        const search = searchHelper(req);
        if (search.regex) {
            find.$or = [
                { fullName: search.regex },
                { email: search.regex }
            ];
        }
        // Đếm tổng số bản ghi phù hợp với điều kiện
        const count = await Account.countDocuments(find);
        // Phân trang
        const objectPagination = paginationHelper(req, count, 4);
        // Sắp xếp và lấy dữ liệu theo phân trang
        const records = await Account.find(find)
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .limit(objectPagination.limitItems)
            .skip(objectPagination.skip);
        // Render trang danh sách
        res.render('admin/pages/accounts/index', {
            pageTitle: "Quản lý tài khoản",
            records: records,
            keyword: search.keyword,
            pagination: objectPagination,
        });
    } catch (error) {
        console.error("Error in accounts.index:", error);
        req.flash("error", "Có lỗi xảy ra khi tải danh sách tài khoản");
        res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
    }
};
// admin/accounts/create get
module.exports.create = async (req, res) => {
    try {
        res.render('admin/pages/accounts/create', {
            pageTitle: "Tạo mới tài khoản"
        });
    } catch (error) {
        console.error("Error in accounts.create:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang tạo tài khoản");
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
};

module.exports.postCreate = async (req, res) => {
    try {
        const { fullName, email, password, status, role } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!fullName || !email || !password) {
            req.flash("error", "Vui lòng điền đầy đủ thông tin");
            return res.redirect(req.get('Referrer') || "/admin/accounts/create");
        }
        
        // Kiểm tra email đã tồn tại chưa
        const emailExist = await Account.findOne({
            email: email,
            deleted: false
        });
        
        if (emailExist) {
            req.flash("error", "Email đã tồn tại");
            return res.redirect(req.get('Referrer') || "/admin/accounts/create");
        }
        
        // Tạo tài khoản mới
        const newAccount = new Account({
            fullName: fullName,
            email: email,
            password: md5(password),
            token: generateToken.generateRandomString(20),
            status: status || "active",
            role: role || "content-manager" // Thêm role mặc định
        });
        
        // Xử lý avatar nếu có upload file
        if (req.file) {
            newAccount.avatar = `/admin/images/${req.file.filename}`;
        }
        
        await newAccount.save();
        
        req.flash("success", "Tạo tài khoản thành công");
        res.redirect("/admin/accounts");
    } catch (error) {
        console.error("Error in accounts.postCreate:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo tài khoản");
        res.redirect(req.get('Referrer') || "/admin/accounts/create");
    }
};

// admin/accounts/edit/:id get
module.exports.edit= async (req, res) => {
    const find={
        deleted:false,
        _id:req.params.id
    }
    const records=await Account.findOne(find)
    // console.log(records)
    res.render('admin/pages/accounts/edit',{
        pagaTitle: "Chinh sua san pham ",
        records:records
    })
}

// admin/accounts/edit/:id patch
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        const { fullName, email, password, status, role } = req.body;
        
        // Kiểm tra tài khoản tồn tại
        const account = await Account.findOne({
            _id: id,
            deleted: false
        });
        
        if (!account) {
            req.flash("error", "Tài khoản không tồn tại");
            return res.redirect("/admin/accounts");
        }
        
        // Kiểm tra email có bị trùng không (nếu thay đổi)
        if (email !== account.email) {
            const emailExist = await Account.findOne({
                _id: { $ne: id },
                email: email,
                deleted: false
            });
            
            if (emailExist) {
                req.flash("error", "Email đã tồn tại");
                return res.redirect(req.get('Referrer') || `/admin/accounts/edit/${id}`);
            }
        }
        
        // Chuẩn bị dữ liệu cập nhật
        const dataUpdate = {
            fullName: fullName,
            email: email,
            status: status,
            role: role
        };
        
        // Xử lý mật khẩu nếu có nhập vào
        if (password) {
            dataUpdate.password = md5(password);
        }
        
        // Xử lý avatar nếu có upload file mới
        if (req.file) {
            // Xóa avatar cũ nếu có
            if (account.avatar && account.avatar.startsWith('/admin/images/')) {
                try {
                    const fileHelper = require("../../helpers/file.helper");
                    fileHelper.deleteFile(account.avatar);
                } catch (error) {
                    console.error("Error deleting old avatar:", error);
                }
            }
            
            // Cập nhật đường dẫn avatar mới
            dataUpdate.avatar = `/admin/images/${req.file.filename}`;
        }
        
        // Cập nhật tài khoản
        await Account.updateOne({ _id: id }, dataUpdate);
        
        req.flash("success", "Cập nhật tài khoản thành công");
        res.redirect("/admin/accounts");
    } catch (error) {
        console.error("Error in accounts.editPatch:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật tài khoản");
        res.redirect(req.get('Referrer') || `/admin/accounts/edit/${id}`);
    }
};

// Thêm phương thức xóa cứng tài khoản admin
module.exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Kiểm tra tài khoản tồn tại
        const account = await Account.findById(id);
        
        if (!account) {
            req.flash("error", "Tài khoản không tồn tại");
            return res.redirect("/admin/accounts");
        }
        
        // Không cho phép xóa tài khoản đang đăng nhập
        if (req.cookies.token === account.token) {
            req.flash("error", "Không thể xóa tài khoản đang đăng nhập");
            return res.redirect("/admin/accounts");
        }
        
        // Xóa avatar nếu có
        if (account.avatar && account.avatar.startsWith('/admin/images/')) {
            try {
                const fileHelper = require("../../helpers/file.helper");
                fileHelper.deleteFile(account.avatar);
            } catch (error) {
                console.error("Error deleting avatar:", error);
                // Vẫn tiếp tục xóa tài khoản ngay cả khi xóa ảnh bị lỗi
            }
        }
        
        // Xóa cứng tài khoản khỏi database
        await Account.deleteOne({ _id: id });
        
        req.flash("success", "Xóa tài khoản thành công");
        return res.redirect("/admin/accounts");
    } catch (error) {
        console.error("Error in account.delete:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa tài khoản");
        return res.redirect("/admin/accounts");
    }
};