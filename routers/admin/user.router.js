const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/user.controller")
const upload = require("../../middleware/upload")

router.get('/', controller.index)

router.get('/edit/:id', controller.edit)
router.patch('/edit/:id', upload.single('avatar'), controller.editPatch)

router.get('/detail/:id', controller.detail)
router.get('/delete/:id', controller.deleteUser)

router.patch('/change-status/:status/:id', controller.changeStatus)

module.exports = router