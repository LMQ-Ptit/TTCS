const Product = require("../../models/product.model");
const ProductHelper = require("../../helpers/product");

module.exports.index= async(req, res) => {
    try{
        // Lay cac san pham noi bat
        const products = await Product.find({
            deleted: false,
            featured: '1',
            status: 'active'
        }).limit(6);
        //lay cac san pham moi nhat
        const newProducts = await Product.find({
            deleted:false,
            status:'active'
        }).limit(6).sort({position:-1});
        const Products=ProductHelper.newPrice(products);
        const NewProducts=ProductHelper.newPrice(newProducts);
        // console.log(Products);
        // console.log(NewProducts);
        res.render("client/pages/home/index",{
            pageTitle :"Trang chu",
            products: Products,
            newProducts: NewProducts
        })
    }catch(error){
        console.log("Lỗi khi lấy sản phẩm nổi bật:", error);
        res.status(500).send("Internal Server Error");
    }
}