const mongoose = require('mongoose');
const generate = require('../helpers/ganerate');

const accountSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    token: {
        type: String,
        default: generate.generateRandomString(20)
    },
    phone: String,
    avatar: String,
    status: String,
    role: {
        type: String,
        enum: ['admin', 'content-manager'],
        default: 'content-manager'
    },
    deleted: {type: Boolean, default: false},
    deletedAt: Date
}, {timestamps: true});

const Account = mongoose.model("Account", accountSchema, 'accounts');

module.exports = Account;