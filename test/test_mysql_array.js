function toSqlArr(arr){
  var tmpArr = new Array(arr.length);
  for(var i = 0; i < arr.length;i++){
    tmpArr[i] = JSON.stringify(arr[i]);
  }
  return tmpArr.join();
}

console.log("mysql_array");

var arrStr = [
  "1","2","3"
];

console.log("to : "+toSqlArr(arrStr));

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
var conn;


// steem init!
var steem = require("steem");
var arrNode = [
  'https://api.steemit.com'
  ,'https://steemd.dist.one'
  //,'https://rpc.dist.one'
  ,'https://steemd-int.steemit.com'
  ,'https://steemd.steemitstage.com'
  ,'https://api.steemitstage.com'
  //,'https://steemd.pevo.science'
];
var idxNode = 0;
steem.api.setOptions({url: arrNode[idxNode] });

// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!

function createConnect() {
  conn = mysql.createConnection(db_config);
  conn.connect(function(err) {
    if(err) {
      logger.error('error when connecting to db:', err);
      setTimeout(createConnect, 2000);
    }
    setInterval(function () {
        conn.query('SELECT 1');
    }, 60000);
    test('"nhj12311","asbear"');
  });
  conn.on('error', function(err) {
    logger.error('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      createConnect();
    } else {
      throw err;
    }
  });
}
createConnect();

function test(author){
  if( author.indexOf("\"") == -1 ){
    author = "\""+ author + "\"";
  }
  fiber(function() {
    var selQry = "select * from svc_acct_mng where dvcd = "+2+" and use_yn = 'Y' and acct_nm in ( "+author+" ) ";
    console.log( "selQry : "+selQry );
    var selRslt = await(conn.query(selQry, [author] , defer() ));
    console.log(selRslt);
  });
}
