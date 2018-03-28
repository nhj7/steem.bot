// init mysql!
var db_config = {
   // 운영 모드.
    prod: {
      host: '127.0.0.1',
      port: '3306',
      user: 'steem_nhj',
      password: 'steem_nhj',
      database: 'steem_nhj',
      connectionLimit:20,
      waitForConnections:false
    },
    // 개발 모드
    dev: {
      host: '127.0.0.1',
      port: '3306',
      user: 'steem_nhj',
      password: 'steem_nhj',
      database: 'steem_nhj',
      connectionLimit:20,
      waitForConnections:false
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
var pool;
function createPool() {
  pool = mysql.createPool(db_config);
}
createPool();

// synchronize init!
const sync = require('synchronize');
const fiber = sync.fiber;
const await = sync.await;
const defer = sync.defer;
// synchronize init end!

function query(sql, params){
  //console.log("query.sql : "+sql );
  var conn = await(pool.getConnection( defer() ));
  var rows;
  try{
      rows = await(conn.query(sql, params, defer() ));
  }catch(err){
    logger.error( "query error!", err );
    throw err;
  }finally{
      conn.release(); // 반환.
      return rows;
  }
}

var moment = require('moment');

fiber(function() {
  var result = query("select * from mention");
  console.log(result[0].reg_dttm);
  var reg_dttm = moment(result[0].reg_dttm).format("YYYY-MM-DD");

  var reg_tm = moment(result[0].reg_dttm).format("HH:mm");
  console.log(reg_tm);


  pool.end();

});