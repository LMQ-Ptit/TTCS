const express=require("express")
const router=express.Router()
//router cho home
const controller=require("../../controllers/client/home.controller")

router.get('/', controller.index)

module.exports=router