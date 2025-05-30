const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
    {
        user_id: String,
        status: {type: String, default: 'active'},
        product:[
            {   
                status: {type: String, default: 'active'},
                product_id: String,
                quantity: Number
            }
        ]
    },
    {timestamps:true}
)
const Cart=mongoose.model("Cart",accountSchema,'carts')

module.exports=Cart  