const express=require("express")
const router=express.Router()
//router cho product
const controller=require("../../controllers/client/products.controller")

router.get('/',controller.index)

router.get('/:slug',controller.detail) 
module.exports=router