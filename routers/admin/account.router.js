const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/account.controller")
const upload = require("../../middleware/upload")

router.get('/', controller.index)

router.get('/create', controller.create)
router.post('/create', upload.single('avatar'), controller.postCreate)

router.get('/edit/:id', controller.edit)
router.patch('/edit/:id', upload.single('avatar'), controller.editPatch)
router.get('/delete/:id', controller.delete)

module.exports = router