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
    },
    friends : Array,
    ignored : Array ,
    MyRequests : {type : Array , default : []},
    SomeOnesRequests : {type : Array , default : []}
});

const User = mongoose.model('users', userSchema,'users');

module.exports = User;
