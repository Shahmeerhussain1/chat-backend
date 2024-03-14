const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {
        type: String,
    },
    profileImage : String , 
    email: {
        type: String,
        required: true,
        unique: true
    },
    _id: {
        type :  String,
         default: () => new mongoose.Types.ObjectId().toString()
     },
    password: {
        type: String,
        required: true
    },
    friends : {type : Array , default : []},
    ignored : {type : Array , default : []} ,
    MyRequests : {type : Array , default : []},
    SomeOnesRequests : {type : Array , default : []}
});

const User = mongoose.model('users', userSchema,'users');

module.exports = User;
