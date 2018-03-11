// module init
const winston = require('winston');
require('winston-daily-rotate-file');

// module end

// winston log init!
const tsFormat = () => (new Date()).toLocaleTimeString();

console.log("tsFormat : " + tsFormat);

const logger = new (winston.Logger)({
   transports: [
     new (winston.transports.Console)({ timestamp: tsFormat }),
     new (winston.transports.DailyRotateFile)({
          // filename property 지정
          name : 'log'
          , filename: '/log/websocket/console.log'
          , datePattern: '.yyyy.MM.dd'
          , prepend: false
          , timestamp: tsFormat
          , level: 'info'
          , json:false
          , localTime : true
          , maxDays: 10
          , maxFiles: 7

      }),
     new (winston.transports.DailyRotateFile)({
         name : 'error_log'
         , filename: '/log/websocket/error.log'
         , datePattern: '.yyyy.MM.dd'
         , prepend: false
         , timestamp: tsFormat
         , level : 'error'
         , json:false
         , localTime : true
         , maxDays: 10
         , maxFiles: 7
     })
   ]
});
logger.log('info', 'log!!!');
logger.info('info');
logger.error('error logs');
// winston log init end.

var cmd = require("../util/cmd.js");
var WebSocketServer = require('websocket').server;
var http = require('http');
var server = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('kglAG-qcYYpheeaaR58ZPtD3QI_CAVjcqJm4iu9bIJ8.epV8hFNdTSGRbyH14ZxPWMD228467A5wlQmcl0pF9zk\n');
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(80, function() { });

var https = require('https');
var fs = require('fs');
var options = {
     key: fs.readFileSync('/etc/letsencrypt/live/steemalls.com/privkey.pem'),
     cert: fs.readFileSync('/etc/letsencrypt/live/steemalls.com/fullchain.pem'),
     //ca: fs.readFileSync('/path/to/chain.pem')
}
var ssl_server = https.createServer(options, function(req, res) {
  res.writeHead(200);
  res.end('kglAG-qcYYpheeaaR58ZPtD3QI_CAVjcqJm4iu9bIJ8.epV8hFNdTSGRbyH14ZxPWMD228467A5wlQmcl0pF9zk\n');
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
ssl_server.listen(443, function() { });

// create the server
wsServer = new WebSocketServer({
  httpServer: server
  , httpsServer : ssl_server
});

// WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  connection.on('open', function(message) {
    logger.info('open');
    console.log(message);
  });
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    //console.log(message);
    if (message.type === 'utf8') {
      // process WebSocket message
      var req = JSON.parse( message.utf8Data );
      cmd.wsExecute(req, connection); // /util/cmd.util.js
    }
  });

  connection.on('close', function(connection) {
    console.log('close : '+connection);
    console.log(connection);
    // close user connection
  });
});
