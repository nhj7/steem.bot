
// winston log init!
var winston = require('winston');
require('winston-daily-rotate-file');
const tsFormat = () => (new Date()).toLocaleTimeString();
var logger = new (winston.Logger)({
   transports: [
     new (winston.transports.Console)({ timestamp: tsFormat }),
     new (winston.transports.DailyRotateFile)({
          // filename property 지정
          name : 'log'
          , filename: '/log/log.log'
          , datePattern: '.yyyy-MM-dd'
          , prepend: false
          , timestamp: tsFormat
          , level: 'info'
          , json:false
      }),
     new (winston.transports.DailyRotateFile)({
         name : 'error_log'
         , filename: '/log/error.log'
         , datePattern: '.yyyy-MM-dd'
         , prepend: false
         , timestamp: tsFormat
         , level : 'error'
         , json:false
     })
   ]
});

logger.log('info', 'log!!!');
logger.info('info');
logger.error('error logs');
// winston log init end.

// steem init!
var steem = require("steem")
steem.api.setOptions({url: 'https://api.steemit.com'});
// steem init! end

// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!

try {
    fiber(function() {
        var obj = await(steem.api.getAccounts(['ned', 'dan'], defer()));
        logger.info(obj);
        obj = await(steem.api.getAccounts(['nhj12311'], defer()));
        logger.info(obj);
    });
} catch(err) {
  logger.error(err);
}
