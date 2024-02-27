const express = require('express')
const User = require('./Schemas/userSchema')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()
const corsOptions = {
  origin: 'http://localhost:3000', 
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions))
const port = 8080





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/allUser', async (req, res) => {
  if (req.query._id) {
    const user = await User.find();
    // console.log('users', user)
    let flag = false
    for (const iterator of user) {
      if (iterator._id == req.query._id) {
        flag = true
        break
      }
    }
    if(flag){
      res.status(200).json({ success: true, data: user.filter((ele)=>{return ele._id !== req.query._id}) })
    }else{
      res.status(200).json({ success: false, data: '_id not found' })
    }
  } else {
    res.status(500).json({ message: "id not provided", success: false });
  }
})





//WMfNIIRJCqzncEHM
// const uri = "mongodb+srv://hussainshahmeer99:WMfNIIRJCqzncEHM@cluster0.0fa2fsk.mongodb.net/Chats?retryWrites=true&w=majority&appName=Cluster0";
const uri = "mongodb+srv://hussainshahmeer99:WMfNIIRJCqzncEHM@cluster0.0fa2fsk.mongodb.net/Chats"


async function run() {
  try {
    await mongoose.connect(uri).then(() => console.log("Connected!"));
    console.log("You successfully connected to MongoDB!");
  } catch (err) {
    console.log("You not connected to MongoDB!", err);

  }
}
run()
