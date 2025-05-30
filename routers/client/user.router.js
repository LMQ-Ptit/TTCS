const express=require("express")
const router=express.Router()

const controller=require("../../controllers/client/user.controller")

router.get('/register', controller.register)
router.post('/register', controller.registerPost)

router.get('/login', controller.login)
router.post('/login', controller.loginPost)

router.get('/logout', controller.logout)

router.get('/info', controller.info)
router.get('/edit', controller.edit)
router.patch("/edit", controller.editPatch);

module.exports=router