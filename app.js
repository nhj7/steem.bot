// custom function create.
if (typeof String.prototype.contains === 'undefined') {
  String.prototype.contains = function(obj) {
    if (Array.isArray(obj)) {
      return obj.some(x => this.indexOf(x) > -1);
    }
    return this.indexOf(obj) != -1;
  }
}

// winston log init!
var winston = require('winston');
require('winston-daily-rotate-file');
const tsFormat = () => (new Date()).toLocaleTimeString();

console.log("tsFormat : " + tsFormat);

var logger = new (winston.Logger)({
   transports: [
     new (winston.transports.Console)({ timestamp: tsFormat }),
     new (winston.transports.DailyRotateFile)({
          // filename property 지정
          name : 'log'
          , filename: '/log/console.log'
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
         , filename: '/log/error.log'
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
var conn;
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
    startBot();
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

// steem init! end

// 실제 DB에 연결.
var cntNodeErr = 0;
var stnrNodeErr = 3;
function rotateNode(){
  if( cntNodeErr >= stnrNodeErr ){
    if( arrNode.length == idxNode+1){
      idxNode = 0;
    }else{
      idxNode++;
    }
    steem.api.setOptions({url: arrNode[idxNode] });
    cntNodeErr = 0;
  }
}

var Fiber = require('fibers');

function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield();
}

function getTopParentInfo(author, permlink){
  var cntWhile = 0;
  while( true ){
    var result = await(steem.api.getContent(author, permlink, defer()));
    //console.log( ++cntWhile + " : " + permlink );
    if( result.parent_author == ""){
      break;
    }
    author = result.parent_author;
    permlink = result.parent_permlink;
  }
  return {
    author : author
    , permlink : permlink
  };
}

function insertWrkList(author, permlink, comment){
  var inQry = "insert into bot_wrk_list "
    + "(dvcd, author, perm_link, comment, wrk_status, vote_yn ) "
    + "values( ?, ?, ?, ?, ?, ?) ";
  var params = [
      1  // dvcd
      , author // author
      , permlink // permlink
      , comment // comment
      , "1" // wrk_status 0:complete, 1:ready, 9:error
      , "N" // vote_yn
  ];
  var inRslt = await(conn.query(inQry, params, defer() ));
  logger.info(inRslt);
}


var sleepTm = 1000;
var pc = "@"; // pre command
var epc = "!"; // pre command
var nl = "\r\n";  // new line
function blockBot(){

try {
    logger.info( "steem init!" );
    // steem 데이터 조회!!
    //obj = await(steem.api.getAccounts(['nhj12311'], defer()));
    var lastBlockNumber = 0;
    var workBlockNumber = 0;
    var startChk = false;
    //console.log(steem.api);
    var release = steem.api.streamBlockNumber('head',function(err, blockNumber){
      fiber(function() {
      if( err != null ){  // 에러가 나는 경우
        cntNodeErr++;
        logger.error(err);
        logger.error("반환 처리 : "+blockNumber);
        release(); // 반환하고
        logger.error("sleep " + sleepTm + "ms");
        sleep(sleepTm);
        rotateNode();
        logger.error("설정 노드 : " + arrNode[idxNode] +" blockBot 실행!");
        blockBot();
        return;
      }

      cntNodeErr = 0;
      lastBlockNumber = blockNumber;
      while( lastBlockNumber > workBlockNumber ){
        if( workBlockNumber == 0 ){
          // 이 부분은 향후 workBlockNumber DB 데이터로 초기화
          workBlockNumber = lastBlockNumber;
        }else{
            workBlockNumber++;
        }
        //logger.info( 'lastBlockNumber : ' + lastBlockNumber + ", workBlockNumber : " + workBlockNumber);


        try {
          var block = await( steem.api.getBlock(workBlockNumber, defer()) );
          if( block.transactions )
          for(var txIdx = 0; txIdx < block.transactions.length; txIdx++ ){
            for(var opIdx = 0; opIdx < block.transactions[txIdx].operations.length; opIdx++ ){
              var operation = block.transactions[txIdx].operations[opIdx];
              // 리스팀을 인식하는 부분.
              if( "custom_json" == operation[0] ){
                  if( operation[1].json ){
                    var custom_json = JSON.parse(operation[1].json);
                    if( "reblog" == custom_json[0] ){
                        logger.info( custom_json );
                        var selQry = "select * from svc_acct_mng where dvcd = 1 and use_yn = 'Y' and acct_nm = '"+custom_json[1].author+"' ";
                        logger.info( "selQry : "+selQry );
                        var selRslt = await(conn.query(selQry, defer() ));
                        if( selRslt.length > 0 ){
                          var comment = "@" + custom_json[1].account + "님께서 이 포스팅에 많은 관심을 가지고 있어요. 리스팀을 해주셨군요~! " ;
                          var inQry = "insert into bot_wrk_list "
                            + "(dvcd, author, perm_link, comment, wrk_status, vote_yn ) "
                            + "values( ?, ?, ?, ?, ?, ?) ";
                          var params = [
                              1  // dvcd
                              , custom_json[1].author // author
                              , custom_json[1].permlink // permlink
                              , comment // comment
                              , "1" // wrk_status 0:complete, 1:ready, 9:error
                              , "N" // vote_yn
                          ];
                          var inRslt = await(conn.query(inQry, params, defer() ));
                          logger.info(inRslt);
                        }
                    } // if( reblog )
                  }

              }// if( "custom_json" == operation[0] ){
              // 포스팅과 댓글은 comment
              else if( "comment" == operation[0] ){
                if( operation[1].parent_author != ""){
                    if( operation[1].body.contains( [ pc + "리스팀", epc + "resteem"] ) ){
                        logger.info( "@" + operation[1].author + " : " + operation[1].body);
                        var useYn = "";

                        // 리스팀 리스트 start
                        if( operation[1].body.contains( [ pc + "리스팀 리스트", pc + "리스팀 목록", pc + "리스팀리스트", epc + "resteem list" , pc + "리스팀목록"] ) ){
                          var postInfo = getTopParentInfo(operation[1].author, operation[1].permlink);
                          console.log(postInfo);
                          var result = await(steem.api.getRebloggedBy(postInfo.author, postInfo.permlink, defer()));
                          console.log(result);
                          var idxAuthor = result.indexOf( postInfo.author );
                          result.splice( idxAuthor , 1 );
                          var cmntReLst = "이 글을 리스팀 해주신 소중한 분들입니다. "+nl;
                          cmntReLst += "리스팀 목록 | "+nl;
                          cmntReLst += "-| "+nl;
                          for(var idx = 0; idx < result.length;idx++){
                            cmntReLst += "["+result[idx]+"](https://steemit.com/@"+result[idx]+")| " + nl;
                          }
                          if( result.length == 0 ){
                            cmntReLst = "아직 리스팀 해주신 분들이 없네요. ㅠㅠ 너무 실망하지 말고 힘내세요.";
                          }
                          console.log(cmntReLst);
                          insertWrkList(operation[1].author, operation[1].permlink, cmntReLst);
                          return;
                        }
                        // 리스팀 리스트 end

                        // 리스팀 on, off 등록 start
                        if( operation[1].body.contains( [pc+"리스팀 켬", pc+"리스팀 등록", pc+"리스팀 on", epc+"resteem on"] ) ){
                          useYn = "Y";
                        }else if( operation[1].body.contains( [pc+"리스팀 끔", pc+"리스팀 해제", pc+"리스팀 off", epc+"resteem off"] ) ){
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
                        var regQry = "";
                        // 있으면 업데이트
                        if( selRslt.length > 0 ){
                          regQry = "update svc_acct_mng set use_yn = '"+ useYn +"' , perm_link = '" + operation[1].permlink + "' where dvcd = 1 and acct_nm = '"+ operation[1].author +"' ";
                        }else{  // 없으면 등록!!!
                          regQry = "insert into svc_acct_mng ( dvcd, acct_nm, perm_link, use_yn ) values (1, '"+ operation[1].author +"', '" + operation[1].permlink + "', '"+useYn+"' ) ";
                        }
                        logger.info("regQry : " + regQry);
                        var regRslt = await(conn.query(regQry, defer() ));
                        logger.info(regRslt);

                        var comment = "리스팀 댓글 안내 서비스가 " +  ( useYn == "Y" ? "등록되었습니다." : "해제되었습니다." );
                        insertWrkList( operation[1].author, operation[1].permlink, comment);
                        // 리스팀 on, off 등록 end
                    }
                }
              } // else if( "comment" == operation[0] ){
            } // for operations
          } // for transactions
        }// try
        catch(err) {
          logger.error(err);
        }

      } // while
      }); // fiber
    }); // streamBlockNumber.
  } catch(err) {
    logger.error(err);
  }

} // function blockBot(){


function wrkBot(){
  fiber(function() {
  try{
  //for(var loopCnt = 0; true ;loopCnt++ ){
      sleep(sleepTm);
      if( conn.state != 'authenticated'){
        return;
      }
      var chk = true;
      logger.info("wrkBot execute." );

      try{
        var selWrkQry = " select * from bot_wrk_list where wrk_status <> 0 order by seq asc ";
        var wrkList = await(conn.query(selWrkQry, [], defer() ));

        if( wrkList == null || wrkList.length <= 0 ){
          return;
        }
        var selBotQry = "select * from bot_acct_mng "
          + " where 1=1 "
          + " and instr(arr_dvcd, ?) > 0 "
          + " and last_comment_dttm < DATE_ADD(now(), INTERVAL -20 second) "
          + " order by last_comment_dttm asc ";

        var botList = await(conn.query(selBotQry, [ 1 ], defer() ));
        if( botList == null && botList.length <= 0 ){
          return;
        }
        for(var i = 0; i < wrkList.length && i < botList.length ;i++){
          logger.info(i +" : "+ JSON.stringify(botList[i]));
          logger.info(i +" : "+ JSON.stringify(wrkList[i]));
          var wif = botList[i].posting_key;
          var author = botList[i].id;
          var parentAuthor = wrkList[i].author;
          var parentPermlink = wrkList[i].perm_link;
          var permlink = steem.formatter.commentPermlink(parentAuthor, parentPermlink);
          var title = "";
          var body = wrkList[i].comment;
          var jsonMetadata = {};

          var commentRslt = await(steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata,defer() ));
          logger.error(commentRslt);

          var botUpQry = "update bot_acct_mng set last_comment_dttm = now() where seq = ? and id = ? " ;
          var botUpRslt = await(conn.query(botUpQry, [ botList[i].seq, botList[i].id ], defer() ));

          var wrkUpQry = "update bot_wrk_list set wrk_status = 0, wrk_dttm = now() where seq = ?" ;
          var wrkUpRslt = await(conn.query(wrkUpQry, [ wrkList[i].seq  ], defer() ));
        }
      }catch(err){
        logger.error("wrkBot error : ", err);
        throw err;
      }
  }catch(err){
    logger.error("wrkBot err : ", err);
    sleep(sleepTm);
  }finally{
    setImmediate(function(){wrkBot()});
  }
  }); // fiber(function() {
};  // wrkBot function end


logger.info("end.");

process.on('exit', function(code) {
  console.log('server exit', code);
  conn.close();
});

process.on('uncaughtException', function(err) {
    console.log('server uncaughtException', err);
    process.exit(1);

});


function startBot(){
  blockBot();
  wrkBot();
}

createConnect();
