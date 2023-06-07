
const { instrument } = require("@socket.io/admin-ui");
const path = require('path')
//socket io
const http = require('http')

const express = require('express')

const Server = require('socket.io')

const cors = require('cors')

//const { Socket } = require('dgram')
const formatMessage = require('./utils/messages')
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/users')

const app = express()
//socket io
const server = http.createServer(app)

//const io = socketio(server)
const io = Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});

  instrument(io, {
    auth: false,
    mode: "development",
  });




//agregado recientemente
//app.use(cors())
/*
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});*/

//agregado recientemente
//comunicacion con el front end set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatSock Bot '

// lo corremos cuando los clientes se conectan
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room)

    socket.join(user.room)

    //para solo los que estan conectados WELCOME CURRENT USER
    socket.emit('message', formatMessage(botName, ' Bienvenido al chat Sock!'))

    //para todos los que estan conectados, cuando un usuario se conecta
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} se unio al chat`),
      )

    //send users and room info
    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    })
  })

  // console.log('New WS conection ...')

  
  //Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    //queremos que emita a todos entonces usamo io.emit()
    // console.log(msg)
//mientras
    const user = getCurrentUser(socket.id)

    io.to(user.room).emit('message', formatMessage(user.username, msg))
  })




  // io.emit() Runs whtn client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id)

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username}  Se salio del chat`),
      )
    }
  })
})


/*
io.on('connection', (socket) => {
  console.log('Cliente conectado')

  // Emitir un mensaje al cliente
  socket.emit('mensaje', 'Hola cliente')
})*/

const PORT = 3000 || process.env.PORT
//socket io
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
