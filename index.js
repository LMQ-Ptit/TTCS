// them module expressjs
const express = require('express')

//them module method-override giup co them phuong thuc put,patch,delete
const methodOverride = require('method-override')
const uploadErrorHandler = require('./middleware/upload-error-handler');

//them module body-parser giup doc du lieu tu form body gui len
const bodyParser = require('body-parser')

//Cai dat flash
const cookieParser = require('cookie-parser')
const flash = require('express-flash')
const session = require('express-session')

//them module dotenv giup doc file env
require("dotenv").config()
//ket noi den dâtbase
const database = require("./config/database")

const systemConfig = require("./config/system")

const route=require("./routers/client/index.route")
const routeadmin=require("./routers/admin/index.route")
// const router = require('./routers/admin/dashboard.route')

database.connect()

const app = express()
const port = process.env.PORT

// cai dat Flash-de hien thong bao
app.use(cookieParser('aadassd'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
//end cai dat Flash
app.use(uploadErrorHandler);
// cai dat body-parser
app.use(bodyParser.urlencoded({ extended: false }))

// cai dat method-override
app.use(methodOverride('_method'))

// cai dat pug 
app.set('views', './views')
app.set('view engine', 'pug')
//App locals Variable 
app.locals.prefixAdmin = systemConfig.prefixAdmin
//nhung file tinh 
app.use(express.static("public"))

// router
route(app)
routeadmin(app)

app.listen(port,()=>{
    console.log(port)
})