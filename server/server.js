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
          , filename: '/log/server/console.log'
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
         , filename: '/log/server/error.log'
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
server.listen(8088, function() { console.log("listen");});
var https = require('https');
var ssl_server;
var ssl_options;

if( process.env.NODE_ENV == 'production' ){
  var fs = require('fs');
  ssl_options = {
    key: fs.readFileSync('/etc/letsencrypt/live/steemalls.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/steemalls.com/fullchain.pem'),
    //ca: fs.readFileSync('/path/to/chain.pem')
  }
  ssl_server = https.createServer(ssl_options, function(req, res) {
    //res.writeHead(200, {'Access-Control-Allow-Origin' : '*'});
    res.writeHead(200);
    res.end('kglAG-qcYYpheeaaR58ZPtD3QI_CAVjcqJm4iu9bIJ8.epV8hFNdTSGRbyH14ZxPWMD228467A5wlQmcl0pF9zk\n');
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
  });
  ssl_server.listen(443, function() { });

}else{

}

module.exports = function(){
  if( process.env.NODE_ENV == 'production' ){
    return ssl_server;
  }else{
    return server;
  }
}
