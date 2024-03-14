const express = require('express')
const User = require('./Schemas/userSchema')
const Chat = require('./Schemas/chatSchema')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser');
const socketIo = require("socket.io");
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express()
const port = 8080
// const server = http.createServer(app);
// const io = socketIo(server);
const { Server } = require("socket.io");
const multer = require('multer');
// const sendFiles = require('./Cloudinary')
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'dazznu7pv',
    api_key: '464378216327312',
    api_secret: 'CkXfLhn3-y_85-fbJv-4PE_I-qo'
});

const HOST = '0.0.0.0';
const server = http.createServer(app);
const io = new Server(server,
  {
    cors: {
      origin: "http://localhost:3000"
    }
  }
);

server.listen(port, HOST, () => {
  console.log('Server running on port 8080');
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })
// {
//   "email" : "help@me.com",
//   "fullName" : "help Me",
//   "password" : "help@me.com"
// }
io.on('connection', (socket) => {
  console.log('A client connected');
});

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions))
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})
const Shields = {
  SALT: 'e8d3a06b282c67d03a959cf88179c66f',
  ALGORITHM: 'aes-256-cbc',
  IV_LENGTH: 16,
  KEY: 'f23dbbe74fa7853879d1cd480a2ddec2',
  PRIVATE_KEY:
    '118188eadccb71345738a3b3ad19161e43468959f0635ac0ca3e3c0b1c3c55b8',
};
const JWT_SECRET =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const generatePassHash = (password) => {
  return crypto
    .pbkdf2Sync(password, Shields.SALT, 1000, 64, 'sha512')
    .toString('hex');
};
const verifyPass = (pass, passHash) => {
  const result = generatePassHash(pass) == passHash ? true : false;
  return result;
};

app.post('/signup', upload.single('file'), async (req, res) => {
  console.log('req?.body', req?.body);
  console.log('req?.file', req?.file);

  if (!req?.body?.email || !req?.body?.password) {
      return res
          .status(400)
          .json({ message: 'Email and password are required.' , success : false });
  }

  const existingUser = await User.findOne({ email: req?.body?.email });

  if (existingUser) {
      return res
          .status(400)
          .json({ message: 'User with this email already exists.', success : false });
  }

  try {
      let newPass = generatePassHash(req?.body?.password);
      const user = new User({
          email: req?.body?.email,
          fullName: req?.body?.fullName,
          password: newPass,
      });
      console.log('user user', user);

      const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(req.file.path, { public_id: user._id }, function (error, result) {
              if (error) {
                  console.log('error', error);
                  reject(error);
              } else {
                  console.log('result', result);
                  user.profileImage = result?.secure_url;
                  resolve(result);
              }
          });
      });

      const userData = await user.save();
      const token = jwt.sign({ userId: userData._id }, JWT_SECRET, {
          expiresIn: '1h',
      });
      delete userData.password;
      return res.status(201).json({
          message: 'User registered successfully.',
          data: userData,
          token: token,
          success : true
      });
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: 'Internal server error.' ,success : false });
  }
});

app.post('/login',  async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found');
        return res
          .status(200)
          .json({ success: false, message: 'Invalid email or password.' });
      }
      console.log('user1', user);
      if (!verifyPass(password, user.password)) {
        return res.status(200).json({ message: 'Invalid  password.' });
      }
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: '1h',
      });

      delete user.password


      return res.json({
        success: true,
        message: 'Login successful.',
        data: user,
        token: token,
      });
    } catch (userError) {
      console.error('User retrieval error:', userError);
      return res
        .status(500)
        .json({
          success: false,
          message: 'Login failed. Please try again later.',
        });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: 'Login failed. Please try again later.',
      });
  }
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
    if (flag) {
      res.status(200).json({ success: true, data: user.filter((ele) => { return ele._id !== req.query._id }) })
    } else {
      res.status(200).json({ success: false, message: '_id not found' })
    }
  } else {
    res.status(500).json({ message: "id not provided", success: false });
  }
})

app.get('/getAllFriends', async (req, res) => {
  if (req.query._id) {
    const user = await User.find(
      {
        friends: { $in: [req.query._id] }
      }
    );

    let chatUsers = []

    for (const iterator of user) {
      chatUsers.push(`${req.query._id}${iterator._id}`)
    }


    const chats = await Chat.find(
      {
        mutualIds: { $in: chatUsers }
      }
    );
    if (user && chats) {
      res.status(200).json({ success: true, data: { users: user, chats: chats } })
    } else {
      res.status(200).json({ success: false, message: 'Friends not found' })
    }
  } else {
    res.status(500).json({ message: "id not provided", success: false });
  }
})

app.get('/allMembers', async (req, res) => {
  if (req.query._id) {
    const user = await User.find();

    let myUser = user?.filter((ele) => { return ele._id == req.query._id })

    let allMembers = []
    for (const iterator of user) {
      if (!iterator?.ignored?.includes(req.query._id) && !iterator?.friends?.includes(req.query._id) && !iterator?.SomeOnesRequests?.includes(req.query._id) && !myUser?.MyRequests?.includes(iterator._id)) {
        allMembers.push(iterator)
      }
    }

    if (myUser) {
      res.status(200).json({ success: true, data: allMembers.filter((ele) => { return ele._id !== req.query._id }) })
    } else {
      res.status(200).json({ success: false, message: 'You are not our user' })
    }
  } else {
    res.status(500).json({ message: "id not provided", success: false });
  }
})

app.post('/handleFriendRequest', async (req, res) => {
  if (req.body.senderId && req.body.receiverId && req.body.decision) {

    if (req.body.decision == "reject") {
      // const user = await User.find({ _id: req.body.receiverId });
      const user1Id = req.body.receiverId; // Saamny wala
      const user2Id = req.body.senderId;

      const users = await User.find({ $or: [{ _id: user1Id }, { _id: user2Id }] });

      const user1 = users.find(user => user._id.toString() === user1Id.toString());
      const user2 = users.find(user => user._id.toString() === user2Id.toString());
      user1.MyRequests = user1?.MyRequests?.filter((ele) => { return ele !== req.body.senderId })
      user2.SomeOnesRequests = user2?.SomeOnesRequests?.filter((ele) => { return ele !== req.body.receiverId })
      user1.ignored.push(req.body.senderId)
      user2.ignored.push(req.body.receiverId)
      //UODAte HERE

      const operations = [
        {
          updateOne: {
            filter: { _id: user1._id },
            update: { $set: { MyRequests: user1.MyRequests, ignored: user1.ignored } }
          }
        },
        {
          updateOne: {
            filter: { _id: user2._id },
            update: { $set: { SomeOnesRequests: user2?.SomeOnesRequests, ignored: user2.ignored } }
          }
        }
      ];
      // const update = await User.findOneAndUpdate({ _id: req.body.receiverId }, { ...user[0] })
      const update = await User.bulkWrite(operations)
      //UPDATE HERE
      // const update = await User.findOneAndUpdate({ _id: req.body.receiverId }, { ...user[0] })
      if (update) {
        return res.status(200).json({ success: true })
      } else {
        return res.status(200).json({ success: false })
      }
    }
    else if (req.body.decision == "accept") {

      // const user = await User.find({ _id: req.body.receiverId });
      const user1Id = req.body.receiverId; // Saamny wala
      const user2Id = req.body.senderId;


      const users = await User.find({ $or: [{ _id: user1Id }, { _id: user2Id }] });


      const user1 = users.find(user => user._id.toString() === user1Id.toString());
      const user2 = users.find(user => user._id.toString() === user2Id.toString());
      user1.MyRequests = user1?.MyRequests?.filter((ele) => { return ele !== req.body.senderId })
      user2.SomeOnesRequests = user2?.SomeOnesRequests?.filter((ele) => { return ele !== req.body.receiverId })
      user1.friends.push(req.body.senderId)
      user2.friends.push(req.body.receiverId)
      //UODAte HERE

      const operations = [
        {
          updateOne: {
            filter: { _id: user1._id },
            update: { $set: { MyRequests: user1.MyRequests, friends: user1.friends } }
          }
        },
        {
          updateOne: {
            filter: { _id: user2._id },
            update: { $set: { SomeOnesRequests: user2?.SomeOnesRequests, friends: user2.friends } }
          }
        }
      ];
      // const update = await User.findOneAndUpdate({ _id: req.body.receiverId }, { ...user[0] })
      const update = await User.bulkWrite(operations)
      // if (update) {
      //    new Chat({
      //     mutualIds : [`${user1._id}${user2._id}` , `${user2._id}${user1._id}`]
      //   }).save()
      //   return res.status(200).json({ success: true })
      // } else {
      //   return res.status(200).json({ success: false })
      // }
      if (update) {
        const newChat = new Chat({
          mutualIds: [`${user1._id}${user2._id}`, `${user2._id}${user1._id}`]
        });

        newChat.save()
          .then((ele) => {
            console.log("ele", ele)
            res.status(200).json({ success: true });
          })
          .catch((error) => {
            console.error('Error saving chat:', error);
            res.status(500).json({ success: false, error: 'Failed to save chat' });
          });
      } else {
        res.status(200).json({ success: false });
      }
    }


  } else {
    return res.status(500).json({ message: "ids not provided", success: false });

  }

})

app.post('/sendFriendRequest', async (req, res) => {
  if (req.body.senderId && req.body.receiverId) {

    const user1Id = req.body.receiverId; // Saamny wala
    const user2Id = req.body.senderId;
    const users = await User.find({ $or: [{ _id: user1Id }, { _id: user2Id }] });
    const user1 = users.find(user => user._id.toString() === user1Id.toString());
    const user2 = users.find(user => user._id.toString() === user2Id.toString());
    user1.SomeOnesRequests.push(req.body.senderId)
    user2.MyRequests.push(req.body.receiverId)

    const operations = [
      {
        updateOne: {
          filter: { _id: user1._id },
          update: { $set: { SomeOnesRequests: user1.SomeOnesRequests } }
        }
      },
      {
        updateOne: {
          filter: { _id: user2._id },
          update: { $set: { MyRequests: user2.MyRequests } }
        }
      }
    ];
    // const update = await User.findOneAndUpdate({ _id: req.body.receiverId }, { ...user[0] })
    const update = await User.bulkWrite(operations)
    if (update) {
      return res.status(200).json({ success: true })
    } else {
      return res.status(200).json({ success: false })
    }
  } else {
    return res.status(500).json({ message: "ids not provided", success: false });

  }

})

app.get('/allFriendRequests', async (req, res) => {
  if (req.query._id) {
    const user = await User.find({
      MyRequests: { $in: [req.query._id] }
    });
    if (user) {
      res.status(200).json({ success: true, data: user })
    } else {
      res.status(200).json({ success: false, message: 'You are not our user' })
    }
  } else {
    res.status(500).json({ message: "id not provided", success: false });
  }
})


app.post('/sendMessage', (req, res) => {

  if (req.body.senderId && req.body.receiverId && req.body.message) {
    Chat.updateMany(
      { mutualIds: { $in: [`${req.body.senderId}${req.body.receiverId}`] } },
      {
        $push: {
          messages: {
            senderId: req.body.senderId,
            receiverId: req.body.receiverId,
            message: req.body.message,
            timeStamp: req.body.timeStamp
          }
        }
      }
    )
      .then(result => {
        io.emit('messageSent', {
          senderId: req.body.senderId,
          receiverId: req.body.receiverId,
          message: req.body.message,
          timeStamp: req.body.timeStamp
        });
        res.status(200).json({ success: true });
      })
      .catch(error => {
        console.error("Error updating documents:", error);
        res.status(500).json({ success: false, error: "Failed to update documents" });
      });
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
// io.listen(port)
