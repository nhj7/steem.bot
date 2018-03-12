var server = require("./server.js")();
console.log(server);
// use socket.io
var io = require('socket.io').listen(server, { origins: '*:*'});
var cmd = require("../util/cmd.js");

// define interactions with client
io.sockets.on('connection', function(socket){
    //send data to client
    // setInterval(function(){
    //     socket.emit('stream', {'title': "A new title via Socket.IO!"});
    // }, 1000);
    socket.on('proxy', function (data) {
      console.log(data);
      cmd.wsExecute(data, socket); // /util/cmd.util.js
    });
});
