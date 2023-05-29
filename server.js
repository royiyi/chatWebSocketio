const path = require('path')
//socket io
const http = require('http')

const express = require('express')

const socketio = require('socket.io')
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

const io = socketio(server)

//comunicacion con el front end set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord Bot'

// lo corremos cuando los clientes se conectan
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room)

    socket.join(user.room)

    //para solo los que estan conectados WELCOME CURRENT USER
    socket.emit('message', formatMessage(botName, ' Welcome to chat cord!'))

    //para todos los que estan conectados, cuando un usuario se conecta
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`),
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

    const user = getCurrentUser(socket.id)

    io.to(user.room).emit('message', formatMessage(user.username, msg))
  })

  // io.emit() Runs whtn client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id)

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username}  left the chat`),
      )
    }
  })
})

const PORT = 3000 || process.env.PORT
//socket io
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
