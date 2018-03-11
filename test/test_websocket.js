var cmd = require("../util/cmd.util.js");
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(8081, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  connection.on('open', function(message) {
    console.log('open');
    console.log(message);
  });
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    console.log(message);
    if (message.type === 'utf8') {
      // process WebSocket message
      var req = JSON.parse( message.utf8Data );
      cmd.wsExecute(req, connection);
    }
  });

  connection.on('close', function(connection) {
    console.log('close : '+connection);
    console.log(connection);
    // close user connection
  });
});
