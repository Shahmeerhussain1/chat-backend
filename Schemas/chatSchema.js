const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    _id: {
       type :  String,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    // recieverId : String ,
    // senderId : String ,
    mutualIds : Array,
    messages : {type : Array , default : []} ,
    
})

const ChatSchema = mongoose.model('chat', MessageSchema, 'chat')

module.exports = ChatSchema