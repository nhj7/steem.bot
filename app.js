
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
//logger.log('info', 'log!!!');
//logger.info('info');
//logger.error('error logs');
// winston log init end.

// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!

// init mysql!
var db_config = {
   // 운영 모드.
    prod: {
      host: '127.0.0.1',
      port: '3306',
      user: 'steem_nhj',
      password: 'steem_nhj',
      database: 'steem_nhj'
    },
    // 개발 모드
    dev: {
      host: '127.0.0.1',
      port: '3306',
      user: 'steem_nhj',
      password: 'steem_nhj',
      database: 'steem_nhj'
    }
};

// 설정된 환경으로 config 적용.
if( process.env.NODE_ENV == 'development' ){
  db_config = db_config.dev;
}else{
  db_config = db_config.prod;
}

var mysql = require('mysql'); // mysql lib load.
// mysql create connection!!
var conn = mysql.createConnection({
        host: db_config.host,
        port: db_config.port,
        user: db_config.user,
        password: db_config.password,
        database: db_config.database
});

// steem init!
var steem = require("steem")
steem.api.setOptions({url: 'https://api.steemit.com'});
// steem init! end

try {
    fiber(function() {
        // 실제 DB에 연결.
        var obj = await( conn.connect( defer() ));
        logger.info("connected.");
        logger.info(obj);
        // select 조회 쿼리!
        var queryResult = await(conn.query("select * from test", defer() ));
        logger.info(queryResult);
        // 테스트 데이터! 등록
        queryResult = await(conn.query("insert into test values(1, 'nhj12311!!!');", defer() ));
        logger.info(queryResult);
        // 등록 후 다시 조회!!
        queryResult = await(conn.query("select * from test", defer() ));
        logger.info(queryResult);
        logger.info( "steem init!!" );
        // steem 데이터 조회!!
        obj = await(steem.api.getAccounts(['nhj12311'], defer()));
        logger.info(obj);
        conn.end();
    });
} catch(err) {
  logger.error(err);
}
