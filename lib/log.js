// module init
const winston = require('winston');
require('winston-daily-rotate-file');
// winston log init!
const tsFormat = () => (new Date()).toLocaleTimeString();

console.log("tsFormat : " + tsFormat);
const logger = new (winston.Logger)({
   transports: [
     new (winston.transports.Console)({ timestamp: tsFormat }),
     new (winston.transports.DailyRotateFile)({
          // filename property 지정
          name : 'log'
          , filename: '/log/test//console.log'
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
         , filename: '/log/test/error.log'
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
