const express = require('express');
const socketio = require('socket.io');
const http = require("http");

const PORT = process.env.PORT || 5000;

const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);

io.on('connect', socket => {
    console.log('Connected :)');

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if(error) return callback(error);
        
        socket.emit('message', { user: 'admin', text: `${user.name}, seja bem-vindo(a) à sala ${user.room}!` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} entrou na sala!` })

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    })

    socket.on('disconnect', () => {
        removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} deixou a sala.` })
        }
    })
})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))