const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

users = [];
servers = []

port = process.env.PORT || 5000;

http.listen(port, () => {
    console.log("started on port " + port);
});

function checkServer(roomNumber) {
    let server = servers.find(s => s.roomNumber == roomNumber);
    if (server != null && server != undefined) {
        return true;
    } else {
        return false;
    }
}

io.on('connection', socket => {
    socket.on('checkRoom', (roomNumber) => {
        roomNumber = roomNumber.toUpperCase();
        if (checkServer(roomNumber)) {
            socket.emit("joinRoom", true);
            console.log("room exists");
        } else {
            socket.emit("joinRoom", false);
            console.log("no such room " + roomNumber);
        }
    });

    socket.on('username', (username, roomNumber) => {
        roomNumber = roomNumber.toUpperCase();
        username = username.toUpperCase();
        users.push({
            id: socket.id,
            username: username,
            roomNumber: roomNumber
        })
        if (checkServer(roomNumber)) {
            socket.join(roomNumber);
            socket.to(servers.find(s => s.roomNumber == roomNumber).id).emit('userJoined', username);
            console.log(username + " joined " + "room " + roomNumber);
        }
    });

    socket.on('serverJoin', () => {
        roomNumber = socket.id.slice(0, 4).toUpperCase();
        socket.join(roomNumber);
        servers.push({
            id: socket.id,
            roomNumber: roomNumber
        });
        socket.emit('roomNumber', roomNumber);
        console.log("server joined - " + socket.id);
        console.log("room created - " + roomNumber);
    });

    socket.on('disconnect', () => {
        var userIndex = users.findIndex(x => x.id === socket.id);
        var serverIndex = servers.findIndex(x => x.id === socket.id);
        if (userIndex > -1) {
            console.log(users[userIndex].username + " disconnected");
            if (checkServer(users[userIndex].roomNumber)) {
                socket.to(servers.find(s => s.roomNumber == users[userIndex].roomNumber).id).emit('userLeft', users[userIndex].username);
            }
            users.splice(userIndex, 1);
        } else if (serverIndex > -1) {
            console.log(servers[serverIndex].id + " disconnected");
            servers.splice(serverIndex, 1);
        }
    });

    socket.on('playerVote', (vote, roomNumber) => {
        roomNumber = roomNumber.toUpperCase();
        console.log("vote recieved from " + vote.name + " for " + vote.team);
        if (checkServer(roomNumber)) {
            socket.to(servers.find(s => s.roomNumber == roomNumber).id).emit('playerVoted', vote);
        } else {
            console.log("SERVER IS DOWN OR DISCONNECTED")
        }
    });

    socket.on('playMatch', (match, roomNumber) => {
        roomNumber = roomNumber.toUpperCase();
        console.log("Match Started");
        console.log("emitting to " + roomNumber);
        socket.to(roomNumber).emit('playMatch', match);
    });

    socket.on('matchOver', (standings, roomNumber) => {
        roomNumber = roomNumber.toUpperCase();
        console.log("winner is: " + standings[standings.length - 1].name);
        socket.to(roomNumber).emit('matchFinished', standings);
    });

    socket.on('newRound', (round, roomNumber) => {
        roomNumber = roomNumber.toUpperCase();
        console.log("New Round: " + round);
        console.log("emitting to " + roomNumber);
        socket.to(roomNumber).emit('newRound', round);
    });
});
