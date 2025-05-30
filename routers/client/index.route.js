const cartMiddleware=require('../../middleware/client/cart.middleware')
const userMiddleware=require('../../middleware/client/user.middleware')


const productRouters=require('./product.route')
const homeRouters=require('./home.route')
const searchRouters=require('./search.router')
const cartRouters=require('./cart.route')
const userRouters=require('./user.router')
const checkoutRouters=require('./checkout.router')
//router cho phan client
module.exports=(app)=>{
    app.use(cartMiddleware.cartId)
    app.use(userMiddleware.infoUser)
    
    app.use('/', homeRouters)
    app.use('/products',productRouters)
    app.use('/search',searchRouters)
    app.use('/cart',cartRouters)
    app.use('/user',userRouters)
    app.use('/checkout',checkoutRouters)
}