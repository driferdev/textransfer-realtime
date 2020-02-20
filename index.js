const server = require('http').createServer();
const { promisify } = require("util");
const io = require('socket.io')(server);
const redis = require('redis')
const redisClient = redis.createClient(6379, 'redis');
const getAsync = promisify(redisClient.get).bind(redisClient);

const serverPort = 8000;

server.listen(serverPort, function() {
    console.log(`App running in http://localhost:${serverPort}`);
});

redisClient.on('connect', function() {
    console.log('Redis client connected');
});

redisClient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});


let texts = {};

let persistTexts = () => {
    setInterval(() => {

    }, 10000)
}

io.on('connection', function(socket) {
    console.log('Client connected');

    socket.on('join', async (data)  => {
        socket.join(data.roomName);
        let totalUsers = socket.adapter.rooms[data.roomName].length;
        let text =  await getAsync(data.roomName) || '';
        let initData = {
            text,
            totalUsers
        }
        io.sockets.to(data.roomName).emit('roomData', initData);
    });

    socket.on('leave', (data) => {
        socket.leave(data.roomName);
        let roomData = socket.adapter.rooms[data.roomName];
        let totalUsers = roomData ? roomData.length : 0;
        if(totalUsers > 0) {
            io.sockets.to(data.roomName).emit('total', totalUsers);
        }
    });

    socket.on('typing', (data) => {
        redisClient.set(data.roomName, data.text);
        socket.to(data.roomName).emit('update', data.text);
    });
});