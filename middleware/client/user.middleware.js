const User = require("../../models/user.model");

module.exports.infoUser = async (req, res, next) => {
    if(req.cookies.tokenUser){
        const user = await User.findOne({
            tokenUser: req.cookies.tokenUser,
            deleted: false
        });
        if(user){
            res.locals.user = user;
        }
    }
    next();
    // if (!req.cookies.token) {
    //     res.redirect(`/admin/auth/login`);
    // } else {
    //     const user = await Account.findOne({ token: req.cookies.token });
    //     if (!user) {
    //         res.redirect(`/admin/auth/login`);
    //     } else {
    //         res.locals.user = user;
    //         next();
    //     }
    // }
};

