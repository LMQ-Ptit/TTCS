const express=require("express")
const router=express.Router()
const controller=require("../../controllers/client/cart.controller")

router.post('/add/:id', controller.add)
router.get("/", controller.index)
router.get('/delete/:id', controller.delete)
router.get('/update/:id/:quantity', controller.update)
router.get('/history', controller.history)

module.exports=router