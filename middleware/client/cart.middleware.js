const Cart = require("../../models/cart.model");

// module.exports.cartId = async (req, res, next) => {
//     if (!req.cookies.cartId) {
//         const cart = new Cart();
//         cart.user_id = req.cookies.tokenUser;
//         await cart.save();
//         const expiresTime = 1000 * 60 * 60 * 24 * 365;

//         res.cookie("cartId", cart.id, {
//             expires: new Date(Date.now() + expiresTime)
//         });
//     } else {
//         const cart=await Cart.findOne({_id:req.cookies.cartId});
//         cart.totalQuantity=cart.product.reduce((total,product)=>total+product.quantity,0);
//         res.locals.cart=cart;
//     }
//     console.log(res.locals.cart);
//     next();
// };
module.exports.cartId = async (req, res, next) => {
    if(req.cookies.tokenUser){
        const cart = await Cart.findOne({
            user_id: req.cookies.tokenUser,
        });
        if(cart){
            // console.log(cart);
        }else{
            const newCart = new Cart();
            newCart.user_id = req.cookies.tokenUser;
            // console.log(newCart);
            await newCart.save();
        }
    }
    next();
}
