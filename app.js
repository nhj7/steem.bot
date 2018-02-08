
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

// 실제 DB에 연결.

//logger.info("connected.");
//logger.info(obj);

// // select 조회 쿼리!
// var queryResult = await(conn.query("select * from test", defer() ));
// logger.info(queryResult);
// // 테스트 데이터! 등록
// queryResult = await(conn.query("insert into test values(1, 'nhj12311!');", defer() ));
// logger.info(queryResult);
// // 등록 후 다시 조회!!
// queryResult = await(conn.query("select * from test", defer() ));
// logger.info(queryResult);

//conn.end(); // db end

try {
    fiber(function() {
        logger.info( "steem init!!" );
        var obj = await( conn.connect( defer() ));
        // steem 데이터 조회!!
        //obj = await(steem.api.getAccounts(['nhj12311'], defer()));
        var lastBlockNumber = 0;
        var workBlockNumber = 0;
        var startChk = false;
        //console.log(steem.api);
        var release = steem.api.streamBlockNumber('head',function(err, blockNumber){
          lastBlockNumber = blockNumber;
          while( lastBlockNumber > workBlockNumber ){
            if( workBlockNumber == 0 ){
              // 이 부분은 향후 workBlockNumber DB 데이터로 초기화
              workBlockNumber = lastBlockNumber;
            }else{
                workBlockNumber++;
            }
            //logger.info( 'lastBlockNumber : ' + lastBlockNumber + ", workBlockNumber : " + workBlockNumber);
            fiber(function() {
              var block = await( steem.api.getBlock(workBlockNumber, defer()) );
              for(var txIdx = 0; txIdx < block.transactions.length; txIdx++ ){
                for(var opIdx = 0; opIdx < block.transactions[txIdx].operations.length; opIdx++ ){
                  var operation = block.transactions[txIdx].operations[opIdx];
                  // 리스팀을 인식하는 부분.
                  if( "custom_json" == operation[0] ){
                      if( operation[1].json ){
                        var custom_json = JSON.parse(operation[1].json);
                        if( "reblog" == custom_json[0] || "resteem" == custom_json[0] ){
                            logger.info( custom_json );
                        }
                      }

                  }// if( "custom_json" == operation[0] ){
                  // 포스팅과 댓글은 comment
                  else if( "comment" == operation[0] ){
                    if( operation[1].parent_author != ""){
                        if( operation[1].body.includes( [ "@리스팀" ] ) ){
                            logger.info( "@" + operation[1].author + " : " + operation[1].body);
                            var useYn = "";
                            if( operation[1].body.indexOf( ["@리스팀 켬", "@리스팀켬", "@리스팀 on"] ) ){
                              useYn = "Y";
                            }else if( operation[1].body.includes( ["@리스팀 끔", "@리스팀끔", "@리스팀 off"] ) ){
                              useYn = "N";
                            }else{
                              // 없으면 넘김.
                              logger.info("comment continue");
                              continue;
                            }
                            // dvcd : 첫번째 서비스인 리스팀 알림 서비스번호는 1번으로.
                            var selQry = "select * from svc_acct_mng where dvcd = 1 and acct_nm = '"+ operation[1].author +"' ";
                            logger.info("selQry : " + selQry);
                            var selRslt = await(conn.query(selQry, defer() ));
                            logger.info(selRslt);
                            // 있으면 업데이트
                            if( selRslt.length > 0 ){
                              var upQry = "update svc_acct_mng set use_yn = '"+ useYn +"' where dvcd = 1 and acct_nm = '"+ operation[1].author +"' ";
                              logger.info("upQry : " + upQry);
                            }else{  // 없으면 등록!!!
                              var inQry = "insert into svc_acct_mng ( dvcd, acct_nm, perm_link, use_yn ) values (1, '"+ operation[1].author +"', '', '"+useYn+"' ) ";
                              logger.info("inQry : " + inQry);
                            }

                        }
                    }
                  } // else if( "comment" == operation[0] ){
                } // for operations
              } // for transactions
            }); // fiber
          } // if( lastBlockNumber > workBlockNumber ){
        }); // streamBlockNumber.
    });
} catch(err) {
  logger.error(err);
}
//release();
