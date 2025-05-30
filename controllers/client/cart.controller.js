const Product = require("../../models/product.model");
const Cart = require("../../models/cart.model");

// Hàm helper để tính toán giá và chi tiết sản phẩm trong giỏ hàng
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

// cart/add/:id post
module.exports.add = async (req, res) => {
    try {
        const productId = req.params.id;
        const quantity = parseInt(req.body.quantity) || 1;
        const user_id = req.cookies.tokenUser;
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
            return res.redirect("/user/login");
        }
        
        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findOne({
            _id: productId,
            deleted: false,
            status: "active"
        });
        
        if (!product) {
            req.flash("error", "Sản phẩm không tồn tại hoặc đã bị xóa");
            return res.redirect("back");
        }
        
        // Kiểm tra số lượng hợp lệ
        if (quantity <= 0) {
            req.flash("error", "Số lượng sản phẩm không hợp lệ");
            return res.redirect("back");
        }
        
        // Kiểm tra tồn kho
        if (product.stock < quantity) {
            req.flash("error", `Chỉ còn ${product.stock} sản phẩm trong kho`);
            return res.redirect("back");
        }
        
        // Tìm hoặc tạo giỏ hàng
        let cart = await Cart.findOne({ user_id: user_id });
        if (!cart) {
            cart = new Cart({
                user_id: user_id,
                product: []
            });
            await cart.save();
        }
        
        // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng
        const existingProductIndex = cart.product.findIndex(
            (item) => item.product_id.toString() === productId
        );
        
        if (existingProductIndex !== -1) {
            // Cập nhật số lượng nếu sản phẩm đã tồn tại
            const newQuantity = cart.product[existingProductIndex].quantity + quantity;
            
            // Kiểm tra số lượng mới không vượt quá tồn kho
            if (newQuantity > product.stock) {
                req.flash("error", `Chỉ còn ${product.stock} sản phẩm trong kho`);
                return res.redirect("back");
            }
            
            await Cart.updateOne(
                {
                    user_id: user_id,
                    "product.product_id": productId
                },
                {
                    "product.$.quantity": newQuantity,
                    "product.$.status": "active"
                }
            );
        } else {
            // Thêm sản phẩm mới vào giỏ hàng
            await Cart.updateOne(
                { user_id: user_id },
                {
                    $push: {
                        product: {
                            product_id: productId,
                            quantity: quantity,
                            status: "active"
                        }
                    }
                }
            );
        }
        
        // Kiểm tra nếu có query param buyNow, chuyển thẳng đến trang giỏ hàng
        if (req.body.buyNow) {
            req.flash("success", "Đã thêm sản phẩm vào giỏ hàng");
            return res.redirect("/cart");
        }
        
        req.flash("success", "Đã thêm sản phẩm vào giỏ hàng");
        return res.redirect("back");
        
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
        req.flash("error", "Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng");
        return res.redirect("back");
    }
};

// cart get
module.exports.index = async (req, res) => {
    try {
        const user_id = req.cookies.tokenUser;
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để xem giỏ hàng");
            return res.redirect("/user/login");
        }
        
        // Tìm giỏ hàng
        let cart = await Cart.findOne({ user_id: user_id });
        
        if (!cart) {
            cart = new Cart({
                user_id: user_id,
                product: []
            });
            await cart.save();
        }
        
        // Lọc chỉ lấy sản phẩm đang active
        const activeProducts = cart.product.filter(item => item.status === "active");
        cart.product = activeProducts;
        
        // Tính toán chi tiết giỏ hàng
        const cartDetails = await calculateCartDetails(cart);
        
        // Chuẩn bị dữ liệu cho view
        const viewData = {
            pageTitle: "Giỏ hàng của bạn",
            cart: {
                ...cart._doc,
                product: cartDetails.items,
                totalPrice: cartDetails.totalPrice,
                totalItems: cartDetails.totalItems
            }
        };
        
        res.render("client/pages/cart/index", viewData);
        
    } catch (error) {
        console.error("Lỗi khi tải giỏ hàng:", error);
        req.flash("error", "Có lỗi xảy ra khi tải giỏ hàng");
        res.redirect("/");
    }
};

// cart/delete/:id get
module.exports.delete = async (req, res) => {
    try {
        const user_id = req.cookies.tokenUser;
        const productId = req.params.id;
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để thực hiện chức năng này");
            return res.redirect("/user/login");
        }
        
        // Cập nhật giỏ hàng - loại bỏ sản phẩm
        const result = await Cart.updateOne(
            { user_id: user_id },
            {
                $pull: {
                    product: {
                        product_id: productId
                    }
                }
            }
        );
        
        if (result.modifiedCount === 0) {
            req.flash("error", "Không tìm thấy sản phẩm trong giỏ hàng");
        } else {
            req.flash("success", "Đã xóa sản phẩm khỏi giỏ hàng");
        }
        
        res.redirect("back");
        
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng");
        res.redirect("back");
    }
};

// cart/update/:id/:quantity get
module.exports.update = async (req, res) => {
    try {
        const user_id = req.cookies.tokenUser;
        const productId = req.params.id;
        const quantity = parseInt(req.params.quantity);
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để thực hiện chức năng này");
            return res.redirect("/user/login");
        }
        
        // Kiểm tra số lượng hợp lệ
        if (isNaN(quantity) || quantity <= 0) {
            req.flash("error", "Số lượng không hợp lệ");
            return res.redirect("back");
        }
        
        // Kiểm tra sản phẩm và tồn kho
        const product = await Product.findOne({ _id: productId });
        if (!product) {
            req.flash("error", "Sản phẩm không tồn tại");
            return res.redirect("back");
        }
        
        if (product.stock < quantity) {
            req.flash("error", `Chỉ còn ${product.stock} sản phẩm trong kho`);
            return res.redirect("back");
        }
        
        // Cập nhật số lượng
        const result = await Cart.updateOne(
            {
                user_id: user_id,
                "product.product_id": productId
            },
            {
                "product.$.quantity": quantity
            }
        );
        
        if (result.modifiedCount === 0) {
            req.flash("error", "Không tìm thấy sản phẩm trong giỏ hàng");
        } else {
            req.flash("success", "Đã cập nhật số lượng sản phẩm");
        }
        
        res.redirect("back");
        
    } catch (error) {
        console.error("Lỗi khi cập nhật giỏ hàng:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật giỏ hàng");
        res.redirect("back");
    }
};

// cart/history get
module.exports.history = async (req, res) => {
    try {
        const user_id = req.cookies.tokenUser;
        
        // Kiểm tra người dùng đã đăng nhập
        if (!user_id) {
            req.flash("error", "Vui lòng đăng nhập để xem lịch sử đơn hàng");
            return res.redirect("/user/login");
        }
        
        // Tìm giỏ hàng
        const cart = await Cart.findOne({ user_id: user_id });
        
        if (!cart) {
            return res.render("client/pages/cart/history", {
                pageTitle: "Lịch sử đơn hàng",
                cart: {
                    product: [],
                    totalPrice: 0,
                    totalItems: 0
                }
            });
        }
        
        // Lọc chỉ lấy sản phẩm inactive (đã mua)
        const inactiveProducts = cart.product.filter(item => item.status === "inactive");
        cart.product = inactiveProducts;
        
        // Tính toán chi tiết giỏ hàng
        const cartDetails = await calculateCartDetails(cart);
        
        // Chuẩn bị dữ liệu cho view
        const viewData = {
            pageTitle: "Lịch sử đơn hàng",
            cart: {
                ...cart._doc,
                product: cartDetails.items,
                totalPrice: cartDetails.totalPrice,
                totalItems: cartDetails.totalItems
            }
        };
        
        res.render("client/pages/cart/history", viewData);
        
    } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
        req.flash("error", "Có lỗi xảy ra khi tải lịch sử đơn hàng");
        res.redirect("/");
    }
};