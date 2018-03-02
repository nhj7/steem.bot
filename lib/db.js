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
const mysql = require('mysql'); // mysql lib load.
// mysql create connection!!
var conn;
function connectDatabase(callback) {
  conn = mysql.createConnection(db_config);
  conn.connect(function(err) {
    if(err) {
      logger.error('error when connecting to db:', err);
      setTimeout(connectDatabase, 2000);
    }
    setInterval(function () {
        conn.query('SELECT 1');
    }, 60000);
    console.log("connect end.");
  });
  conn.on('error', function(err) {
    logger.error('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      connectDatabase();
    } else {
      throw err;
    }
  });
}
connectDatabase();
module.exports = conn;
