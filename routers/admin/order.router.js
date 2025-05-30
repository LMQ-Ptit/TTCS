const express=require("express")
const router=express.Router()
const controller=require("../../controllers/admin/order.controller")

router.get('/', controller.index)
router.get('/detail/:id', controller.detail)
router.get('/delete/:id', controller.delete)
router.get('/edit/:id', controller.edit)
router.patch('/edit/:id', controller.editPatch)
router.post("/change-status/:status/:id", controller.changeStatus);

module.exports=router