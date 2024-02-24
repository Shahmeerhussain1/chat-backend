const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    _id: {
        type: String,
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('users', userSchema,'users');

module.exports = User;
