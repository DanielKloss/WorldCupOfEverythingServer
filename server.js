const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

users = [];
serverId = ''

port = process.env.PORT || 5000;

http.listen(port, () => {
    console.log("started on port " + port);
});

io.on('connection', socket => {
    socket.on('username', (username) => {
        users.push({
            id: socket.id,
            username: username.toUpperCase()
        })
        console.log(username.toUpperCase() + " joined");
        console.log(users);

        socket.to(serverId).emit('userJoined', username.toUpperCase());
    });

    socket.on('serverJoin', () => {
        serverId = socket.id;
        console.log("server joined");
        console.log(serverId);
    });

    socket.on('disconnect', () => {
        var index = users.findIndex(x => x.id === socket.id)
        if (index > -1) {
            console.log(users[index].username + " disconnected");
            users.splice(index, 1);
        }
    });

    socket.on('playerVote', (vote) => {
        console.log("vote recieved from " + vote.name + " for " + vote.team.name);
        socket.to(serverId).emit('playerVoted', vote);
    });

    socket.on('playMatch', (match) => {
        console.log("Match Started");
        socket.broadcast.emit('playMatch', match);
    });

    socket.on('matchOver', (standings) => {
        console.log("winner is: " + standings[standings.length - 1].name);
        socket.broadcast.emit('matchFinished', standings);
    });

    socket.on('newRound', (round) => {
        console.log("New Round: " + round);
        socket.broadcast.emit('newRound', round);
    });
});
