const express=require("express")
const router=express.Router()
//router cho dashboard
const controller=require("../../controllers/admin/dashboard.controller")

router.get('/', controller.dashboard)

module.exports=router