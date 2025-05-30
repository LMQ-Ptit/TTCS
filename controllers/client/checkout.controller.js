const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const User = require("../../models/user.model");


const calculateCartDetails = async (cart) => {
    if (!cart || !cart.product || cart.product.length === 0) {
        return {
            items: [],
            totalPrice: 0,
            totalItems: 0
        };
    }
    
    const items = [];
    let totalPrice = 0;
    
    for (const item of cart.product) {
        try {
            const productInfo = await Product.findOne({
                _id: item.product_id,
                deleted: false,
                status: "active"
            });
            
            if (productInfo) {
                // Tính giá mới sau giảm giá
                const priceNew = (productInfo.price * (100 - productInfo.discountPercentage) / 100).toFixed(0);
                const itemTotal = item.quantity * priceNew;
                
                items.push({
                    ...item._doc,
                    productInfo: {
                        ...productInfo._doc,
                        priceNew: parseInt(priceNew)
                    },
                    totalPrice: itemTotal
                });
                
                totalPrice += itemTotal;
            }
        } catch (error) {
            console.error("Lỗi khi xử lý sản phẩm trong giỏ hàng:", error);
            // Tiếp tục với sản phẩm tiếp theo nếu có lỗi
        }
    }
    
    return {
        items,
        totalPrice,
        totalItems: items.length
    };
};

// checkout get
module.exports.index = async(req, res) => {
    try {
        const user_id = req.cookies.tokenUser;
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để tiến hành thanh toán");
            return res.redirect("/user/login");
        }
        
        // Tìm giỏ hàng
        const cart = await Cart.findOne({ user_id: user_id });
        
        if (!cart || !cart.product || cart.product.length === 0) {
            req.flash("error", "Giỏ hàng trống, vui lòng thêm sản phẩm trước khi thanh toán");
            return res.redirect("/cart");
        }
        
        // Lọc chỉ lấy sản phẩm đang active
        const activeProducts = cart.product.filter(item => item.status === "active");
        
        if (activeProducts.length === 0) {
            req.flash("error", "Giỏ hàng trống, vui lòng thêm sản phẩm trước khi thanh toán");
            return res.redirect("/cart");
        }
        
        cart.product = activeProducts;
        
        // Tính toán chi tiết giỏ hàng
        const cartDetails = await calculateCartDetails(cart);
        
        // Lấy thông tin người dùng
        const user = await User.findOne({ tokenUser: user_id });
        
        // Chuẩn bị dữ liệu cho view
        const viewData = {
            pageTitle: "Thanh toán",
            cart: {
                ...cart._doc,
                product: cartDetails.items,
                totalPrice: cartDetails.totalPrice,
                totalItems: cartDetails.totalItems
            },
            user: user || {}
        };
        
        res.render("client/pages/checkout/index", viewData);
    } catch (error) {
        console.error("Lỗi khi tải trang thanh toán:", error);
        req.flash("error", "Có lỗi xảy ra khi tải trang thanh toán");
        res.redirect("/cart");
    }
};

// checkout/order post
module.exports.order = async(req, res) => {
    try {
        const user_id = req.cookies.tokenUser;
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để đặt hàng");
            return res.redirect("/user/login");
        }
        
        // Kiểm tra thông tin đầu vào
        const { fullName, phone, address, totalPrice } = req.body;
        
        if (!fullName || !phone || !address) {
            req.flash("error", "Vui lòng điền đầy đủ thông tin giao hàng");
            return res.redirect("/checkout");
        }
        
        // Tìm giỏ hàng
        const cart = await Cart.findOne({ user_id: user_id });
        
        if (!cart || !cart.product || cart.product.length === 0) {
            req.flash("error", "Giỏ hàng trống, không thể đặt hàng");
            return res.redirect("/cart");
        }
        
        // Lọc chỉ lấy sản phẩm đang active (đang trong giỏ hàng hiện tại)
        const activeProducts = cart.product.filter(item => item.status === "active");
        
        if (activeProducts.length === 0) {
            req.flash("error", "Giỏ hàng trống, không thể đặt hàng");
            return res.redirect("/cart");
        }
        
        // Tạo đơn hàng mới
        const order = new Order({
            user_id: user_id,
            userInfo: {
                fullName: fullName,
                phone: phone,
                address: address
            },
            products: activeProducts.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            })),
            totalPrice: totalPrice,
            status: "pending"
        });
        
        // Lấy thông tin chi tiết sản phẩm trong đơn hàng
        for (const item of order.products) {
            const product = await Product.findOne({ _id: item.product_id });
            if (product) {
                // Tính giá sau giảm giá
                const priceNew = (product.price * (100 - product.discountPercentage) / 100).toFixed(0);
                
                item.productInfo = {
                    ...product._doc,
                    priceNew: parseInt(priceNew)
                };
                
                // Cập nhật số lượng tồn kho
                product.stock -= item.quantity;
                await product.save();
            }
        }
        
        await order.save();
        
        // FIX: Chỉ đánh dấu các sản phẩm trong đơn hàng hiện tại là inactive
        // Lấy danh sách ID sản phẩm trong đơn hàng hiện tại
        const currentOrderProductIds = order.products.map(item => 
            item.product_id.toString());
        
        // Cập nhật từng sản phẩm thay vì ghi đè toàn bộ mảng
        for (const item of cart.product) {
            // Chỉ đánh dấu các sản phẩm trong đơn hàng hiện tại
            if (currentOrderProductIds.includes(item.product_id.toString()) && 
                item.status === "active") {
                item.status = "inactive";
            }
        }
        
        await cart.save();
        
        // Hiển thị trang xác nhận đặt hàng thành công
        res.render("client/pages/checkout/order", {
            pageTitle: "Đặt hàng thành công",
            order: order
        });
    } catch (error) {
        console.error("Lỗi khi đặt hàng:", error);
        req.flash("error", "Có lỗi xảy ra khi đặt hàng");
        res.redirect("/checkout");
    }
};