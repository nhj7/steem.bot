// custom function create.
if (typeof String.prototype.contains === 'undefined') {
  String.prototype.contains = function(obj) {
    if (Array.isArray(obj)) {
      return obj.some(x => this.indexOf(x) > -1);
    }
    return this.indexOf(obj) != -1;
  }
}

function toSqlArr(arr){
  var tmpArr = new Array(arr.length);
  for(var i = 0; i < arr.length;i++){
    tmpArr[i] = JSON.stringify(arr[i]);
  }
  return tmpArr.join();
}
// custom function create end.

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
const sync = require('synchronize');
const fiber = sync.fiber;
const await = sync.await;
const defer = sync.defer;
// synchronize init end!



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

// steem init!
const steem = require("steem");
const arrNode = [
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

// web scrapping module init
const request = require('request');
const iconv = require('iconv-lite') //인코딩을 변환 해주는 모듈, 필자는 iconv보다 iconv-lite를 선호한다.
const charset = require('charset') //해당 사이트의 charset값을 알 수 있게 해준다.
const qs = require('querystring');
const cheerio = require('cheerio');
// web scrapping module end

function awaitRequest(param, callback){
  request(param, function(error, res, body){
    var data = { res : res, body : body };
    callback(error, data );
  });
}

// function query(sql ){
//   return query(sql, []);
// }

function query(sql, params){
  //console.log("query.sql : "+sql );
  var conn = await(pool.getConnection( defer() ));
  var rows = await(conn.query(sql, params, defer() ));
  //console.log( rows );
  conn.release(); // 반환.
  return rows;
}

function inqryGoogle( query ){
  const queryString = "site:steemit.com " + query;
  const queryStringEscape = qs.escape(queryString);
  //console.log(queryStringEscape);
  const items = new Array();
  const arrQs = queryString.split(" ");
  const inqryCnt = 1;
  for(var i = 0; i < inqryCnt ; i++){
  const url = 'https://www.google.co.kr/search?newwindow=1&q='+queryStringEscape+'&oq='+queryStringEscape+"&start="+(i*10);
  try{
    var result = await(awaitRequest({url:url, encoding : null }, defer() ));
    //console.log(result);
    var error = result.error;
    var res = result.res;
    var body = result.body;
    if (error) {throw error};
    const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
    const html = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩
    var $ = cheerio.load(html);
    $('.g').each(function(idx){
        const doc = $(this);
        let title = doc.find("a").text().replace("— Steemit저장된 페이지","");
        title = title.replace("...저장된 페이지","");
        if( title ==  queryString + " 관련 이미지" ){
          return;
        }
        const href = doc.find("a").attr("href");
        const href_unescape = qs.unescape(href);
        const hrefSplit1 = href_unescape.split("/");
        let st = doc.find(".st").text().replace(/\n/gi, "");
        for(var i = 1; i < arrQs.length ;i++){
          if( arrQs[i].trim() == "" ) continue;
          var re = new RegExp(arrQs[i],"gi");
          st = st.replace(re, "<b>"+arrQs[i]+"</b>").replace(/\|/gi, "│");
          title = title.replace(re, "<b>"+arrQs[i]+"</b>").replace(/\|/gi, "│");
        }
        if(hrefSplit1.length < 6 || hrefSplit1[5].indexOf("@") == -1 ){
          return;
        }
        const permlink = hrefSplit1[6].split("&")[0];
        var item = {
          link : "/" + hrefSplit1[5] + "/" + hrefSplit1[6].split("&")[0]
          , author : hrefSplit1[5].substring(1)
          , permlink : permlink
          , title : title
          , st : st
          , avatar : "https://steemitimages.com/u/"+hrefSplit1[5].substring(1)+"/avatar"
        };
        items.push(item);
    }); // $('.g').each(function(idx){
  }catch(e){
    console.log("e : "+e);
  }
  if( inqryCnt > i+1){
      sleep(500); // google search wait. 0.5 sec.
  }
  } // for
  console.log(items);
  return items;
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
function getTopParentContent(author, permlink){
  var parentInfo = getTopParentInfo(author, permlink);
  var result = await(steem.api.getContent(parentInfo.author, parentInfo.permlink, defer()));
  return result;
}

function insertWrkList(author, permlink, comment, src_author, src_permlink){
  logger.info("insertWrkList : " + author + ", " + author + ","+comment );
  var inQry = "insert into bot_wrk_list "
    + "(dvcd, author, permlink, comment, wrk_status, vote_yn, src_author, src_permlink ) "
    + "values( ?, ?, ?, ?, ?, ?, ?, ? ) ";
  var params = [
      1  // dvcd
      , author // author
      , permlink // permlink
      , comment // comment
      , "1" // wrk_status 0:complete, 1:ready, 9:error
      , "N" // vote_yn
      , src_author
      , src_permlink
  ];
  var inRslt = (query(inQry, params ));
  //logger.info(inRslt);
}

function mergeSvcAcctMng(dvcd, acct_nm, permlink, useYn){
  var selQry = "select * from svc_acct_mng where dvcd = "+dvcd+" and acct_nm = '"+ acct_nm +"' ";
  //logger.info("selQry : " + selQry);
  var selRslt = (query(selQry ));
  //logger.info(selRslt);
  var regQry = "";
  // 있으면 업데이트
  if( selRslt.length > 0 ){
    regQry = "update svc_acct_mng set use_yn = '"+ useYn +"' , permlink = '" + permlink + "' where dvcd = "+dvcd+" and acct_nm = '"+ acct_nm +"' ";
  }else{  // 없으면 등록!!!
    regQry = "insert into svc_acct_mng ( dvcd, acct_nm, permlink, use_yn ) values ("+dvcd+", '"+ acct_nm +"', '" + permlink + "', '"+useYn+"' ) ";
  }
  //logger.info("regQry : " + regQry);
  var regRslt = (query(regQry ));
  //logger.info(regRslt);
}

function getUseYn(body , ko, en){
  var useYn = "";
  if( body.contains( [pc+ko+" 켬", pc+ko+" 등록", pc+ko+" on", epc+en+" on"] ) ){
    useYn = "Y";
  }else if( body.contains( [pc+ko+" 끔", pc+ko+" 해제", pc+ko+" off", epc+en+" off"] ) ){
    useYn = "N";
  }
  return useYn;
}

function selectSvcAccMng(dvcd, author){
  if( author.indexOf("\"") == -1 ){
    author = "\""+ author + "\"";
  }
  var selQry = "select * from svc_acct_mng where dvcd = "+dvcd+" and use_yn = 'Y' and acct_nm in ( "+author+" ) ";
  //logger.info( "selQry : "+selQry );
  var selRslt = query(selQry, []);
  return selRslt;
}

function srchNewPostAndRegCmnt(source, target){
  if( source.author == target.acct_nm || source.parent_author == target.acct_nm ){
    return;
  }

  var exQry = " select * from bot_wrk_list ";
  exQry += " where 1=1 ";
  exQry += " and reg_dttm > DATE_ADD(now(), INTERVAL -7 day)";
  exQry += " and author = ?";
  exQry += " and src_author = ?";
  exQry += " and src_permlink = ?";

  logger.error(source.author + " , " + source.permlink);

  var exRslt = (query(exQry, [target.acct_nm, source.author, source.permlink] ));
  if( exRslt.length > 0 ){
    logger.error("이미 달려서 댓글 달지마삼...");
    return;
  }
  //logger.info(source);
  //logger.info(target);
  var originalPost;
  if( source.parent_author != "" ){
    var originalPost = getTopParentContent( source.author, source.permlink );
  }else{
    originalPost = source;
  }
  var comment = "["+ source.author + "](/@"+source.author+")님이 ";
  comment += target.acct_nm + "님을 멘션하셨습니당. 아래 링크를 누르시면 연결되용~ ^^ <br />";
  var pull_link = "/"+originalPost.category+"/@"+originalPost.author+"/"+originalPost.permlink+"#@" + source.author+"/"+source.permlink ;
  comment += ("["+ originalPost.title + "](" + pull_link +")");
  logger.info(comment);
  var lastCmnt = await(steem.api.getDiscussionsByAuthorBeforeDate(target.acct_nm, null, '2100-01-01T00:00:00', 1, defer()));
  if( lastCmnt.length == 0 ){
    lastCmnt = await(steem.api.getDiscussionsByComments({ start_author : target.acct_nm, limit: 1}, defer()));
  }
  //logger.error(lastCmnt);
  if( lastCmnt.length == 0 ) return;
  logger.info("lastCmnt : "+lastCmnt.title);
  // var reples = await(steem.api.getContentReplies(lastCmnt[0].author, lastCmnt[0].permlink, defer()));
  // for(var rpIdx = 0; rpIdx < reples.length;rpIdx++){
  //     if( reples[rpIdx].body.indexOf(pull_link) > -1 ){
  //       return;
  //     }
  // }
  insertWrkList(lastCmnt[0].author, lastCmnt[0].permlink, comment, source.author, source.permlink);
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
                      if( selectSvcAccMng(1, custom_json[1].author).length > 0 ){
                        var comment = "@" + custom_json[1].account + "님께서 이 포스팅에 많은 관심을 가지고 있어요. 리스팀을 해주셨군요~! " ;
                        insertWrkList(custom_json[1].author, custom_json[1].permlink, comment);
                      }
                    } // if( reblog )
                  } // if( operation[1].json ){
              }// if( "custom_json" == operation[0] ){
              // 포스팅과 댓글은 comment
              else if( "comment" == operation[0] ){

                if( operation[1].json_metadata ){
                  var jsonMetadata = JSON.parse( operation[1].json_metadata );
                  if( jsonMetadata.users ){
                    //logger.error( jsonMetadata.users );
                    //logger.error( "toSqlStr : "+toSqlArr(jsonMetadata.users) );

                    var selRslt = selectSvcAccMng(2, toSqlArr(jsonMetadata.users));
                    //logger.error( "selRslt : "+selRslt );
                    if(  Array.isArray(selRslt) && selRslt.length > 0 )
                    for(var idxSel = 0; idxSel < selRslt.length;idxSel++){
                      srchNewPostAndRegCmnt( operation[1], selRslt[idxSel] );
                    }
                    else if( selRslt.length > 0){
                      srchNewPostAndRegCmnt( operation[1], selRslt );
                    }
                  }
                }

                if( operation[1].parent_author != ""){ // 댓글만
                  var useYn = "";
                  var dvcd = "";
                  var comment = "";
                    if( operation[1].body.contains( [ pc + "검색", epc + "search"] ) ){
                      if( operation[1].body.length > 64 ){
                        logger.info("검색어 길이가 너무 깁니다. " + operation[1].body);
                        continue;
                      }else if(
                        operation[1].body.indexOf(pc + "검색") > 0
                        || operation[1].body.indexOf(epc + "search") > 0
                      ){
                        logger.info("검색 형식에 맞지 않습니다." + operation[1].body);
                        continue;
                      }
                      const query = operation[1].body.replace(pc + "검색", "").replace(epc + "search", "").trim();
                      const items = inqryGoogle(query);
                      dvcd = "3";
                      var comment = "안녕하세여. @steem.apps입니당. 요청하신 구글 내 스팀잇 `["+query+"]` 검색 결과에요~♥ <br /> "+nl+nl;

                      for(var i = 0; i < items.length ;i++){
                        comment += "["+(i+1) + ". " + items[i].author + "님의 "+items[i].title+"](/@"+items[i].author+"/"+items[i].permlink+") " + " |"+nl;
                        if( i == 0 ){
                          comment += "--|" + nl;
                        }
                        comment += "<sup>" + items[i].st + "|</sup>" + nl;
                      }
                    }
                    else if( operation[1].body.contains( [ pc + "리스팀", epc + "resteem"] ) ){
                        logger.info( "@" + operation[1].author + " : " + operation[1].body);
                        // 리스팀 리스트 start
                        if( operation[1].body.contains( [ pc + "리스팀 리스트", pc + "리스팀 목록", pc + "리스팀리스트", epc + "resteem list" , pc + "리스팀목록"] ) ){
                          var postInfo = getTopParentInfo(operation[1].author, operation[1].permlink);
                          console.log(postInfo);
                          var result = await(steem.api.getRebloggedBy(postInfo.author, postInfo.permlink, defer()));
                          console.log(result);
                          var idxAuthor = result.indexOf( postInfo.author );
                          result.splice( idxAuthor , 1 );
                          var cmntReLst = "이 글을 리스팀 해주신 소중한 분들입니당~ "+nl;
                          cmntReLst += "리스팀 목록 | "+nl;
                          cmntReLst += "-| "+nl;
                          for(var idx = 0; idx < result.length;idx++){
                            cmntReLst += "["+result[idx]+"](/@"+result[idx]+")| " + nl;
                          }
                          if( result.length == 0 ){
                            cmntReLst = "아직 리스팀 해주신 분들이 없네요. ㅠㅠ 너무 실망하지 말고 힘내세영~";
                          }
                          console.log(cmntReLst);
                          insertWrkList(operation[1].author, operation[1].permlink, cmntReLst);
                          continue;
                        }
                        // 리스팀 리스트 end
                        useYn = getUseYn(operation[1].body, "리스팀", "resteem");  // body, ko, en
                        if(useYn==""){
                          // 없으면 넘김.
                          logger.info("comment continue");
                          continue;
                        }
                        dvcd = "1"; // 리스팀 안내
                        comment = "리스팀 댓글 안내 서비스가 " +  ( useYn == "Y" ? "등록되었습니당." : "해제되었습니당." );
                        // 리스팀 on, off 등록 end
                    }// if( operation[1].body.contains( [ pc + "리스팀", epc + "resteem"] ) ){
                    else if( operation[1].body.contains( [ pc + "멘션", epc + "mention"] ) ){
                      var useYn = getUseYn(operation[1].body, "멘션", "mention");  // body, ko, en
                      if(useYn==""){
                        // 없으면 넘김.
                        logger.info("comment continue");
                        continue;
                      }
                      dvcd = "2";
                      var comment = "멘션 댓글 안내 서비스가 " +  ( useYn == "Y" ? "등록되었습니당." : "해제되었습니당." );
                    }
                    if( dvcd != "" ){
                        mergeSvcAcctMng(dvcd, operation[1].author, operation[1].permlink, useYn);
                    }
                    if( comment != "" ){
                        insertWrkList( operation[1].author, operation[1].permlink, comment);
                    }
                }   // if( operation[1].parent_author != ""){ // 댓글만
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
      // if( conn.state != 'authenticated'){
      //   return;
      // }
      var chk = true;
      logger.info("wrkBot execute" );

      try{
        var selWrkQry = " select * from bot_wrk_list where wrk_status <> 0 order by seq asc ";
        var wrkList = (query(selWrkQry, [1] ));
        //logger.info( wrkList );
        if( wrkList == null || wrkList.length <= 0 ){
          return;
        }
        var selBotQry = "select * from bot_acct_mng "
          + " where 1=1 "
          + " and instr(arr_dvcd, ?) > 0 "
          + " and last_comment_dttm < DATE_ADD(now(), INTERVAL -20 second) "
          + " order by last_comment_dttm asc ";

        var botList = (query(selBotQry, [1] ));
        if( botList == null && botList.length <= 0 ){
          return;
        }
        for(var i = 0; i < wrkList.length && i < botList.length ;i++){
          logger.info(i +" : "+ JSON.stringify(botList[i]));
          logger.info(i +" : "+ JSON.stringify(wrkList[i]));
          var wif = botList[i].posting_key;
          var author = botList[i].id;
          var parentAuthor = wrkList[i].author;
          var parentPermlink = wrkList[i].permlink;
          var permlink = steem.formatter.commentPermlink(parentAuthor.replace(/./gi,"-"), parentPermlink);
          var title = "";
          var body = wrkList[i].comment;
          var jsonMetadata = {};

          var commentRslt = await(steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata,defer() ));
          logger.error(commentRslt);

          var botUpQry = "update bot_acct_mng set last_comment_dttm = now() where seq = ? and id = ? " ;
          var botUpRslt = (query(botUpQry, [ botList[i].seq, botList[i].id ] ));

          var wrkUpQry = "update bot_wrk_list set wrk_status = 0, wrk_dttm = now() where seq = ?" ;
          var wrkUpRslt = (query(wrkUpQry, [ wrkList[i].seq  ] ));

          var arrAcct = await(steem.api.getAccounts([ botList[i].id ], defer() ));
          var secondsago = (new Date - new Date(arrAcct[0].last_vote_time + "Z")) / 1000;
          var vpow = arrAcct[0].voting_power + (10000 * secondsago / 432000);
          vpow = Math.min(vpow / 100, 100).toFixed(2);
          var weight = 100; // 100%
          weight = weight * 100;
          if( vpow > 93 ){
            steem.broadcast.vote(wif, botList[i].id, parentAuthor, parentPermlink, weight, function(err, result) { logger.info(err, result); });
          }

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
  if( conn ){
      conn.close();
  }
});

process.on('uncaughtException', function(err) {
    console.log('server uncaughtException', err);
    process.exit(1);
});

// transfer내용을 읽는 walletBot
// acct_hist_mng에 등록된 최종넘버를 기점으로 등록된 계정 별 스팀블럭을 읽는다.
const hist_limit = 10;    // getAccountHistory limit.
const walletTerm = 30000; // 10초 체크
function walletBot(){
  fiber(function() {
    try {
      //sleep(walletTerm);
      var mngList = query(" select * from acct_hist_mng ");
      logger.info(mngList );
      for(var idxMng = 0; idxMng < mngList.length; idxMng++){
        var lastNum = parseInt(mngList[idxMng].last_num);
        if( lastNum > 0 ) {
          lastNum++;
        }
        var next_num =  lastNum + hist_limit;
        var histLimit = hist_limit;
        if( lastNum > hist_limit ){
          next_num--;
          histLimit--;
        }
        logger.info("acct_nm : " + mngList[idxMng].acct_nm + ", next_num : " + next_num + ", limit : " + histLimit );
        var transactions = await(steem.api.getAccountHistory(mngList[idxMng].acct_nm, next_num , histLimit, defer()));
        for(var idxTr = 0; idxTr < transactions.length;idxTr++){
          //logger.info( "num : "+transactions[idxTr][0] );
          const op_type = transactions[idxTr][1].op[0];
          const trx_id = transactions[idxTr][1].trx_id;
          const block = transactions[idxTr][1].block;
          const trx_in_block = transactions[idxTr][1].trx_in_block;
          const op_in_trx = transactions[idxTr][1].op_in_trx;
          const virtual_op = transactions[idxTr][1].virtual_op;
          const trx_timestamp = transactions[idxTr][1].timestamp;
          const json_metadata = transactions[idxTr][1].op[1];
          const current_num = transactions[idxTr][0];

          if( op_type == 'transfer' ){
            const from = json_metadata.from;
            const to = json_metadata.to;
            const type = json_metadata.amount.includes("STEEM")?"STEEM":"SBD";
            const memo = json_metadata.memo;
            const amount = parseFloat(json_metadata.amount.replace("STEEM", "").replace("SBD", ""));


            var selRslt = query( "select * from transfer where trx_id = ? ", [trx_id] );

            if( selRslt.length > 0 ){
              logger.warn("already saved this transfer! [" + trx_id +"], from : " + from + ", to : " + to + ", amount : " + amount + ", current_num : " + current_num);
              continue;
            }

            logger.info( "trx_id : " + trx_id );
            logger.info( "block : " + block );
            logger.info( "trx_in_block : " + trx_in_block );
            logger.info( "op_in_trx : " + op_in_trx );
            logger.info( "virtual_op : " + virtual_op );
            logger.info( "trx_timestamp : " + trx_timestamp );
            logger.info( "from : " + from );
            logger.info( "to : " + to );
            logger.info( "amount : " + amount );
            logger.info( "type : " + type );
            logger.info( "memo : " + memo );

            var inQry = "insert into transfer ( trx_id, from_acct, to_acct, amount, transfer_type, memo, num "
            + ", block, trx_in_block, op_in_trx, virtual_op, trx_timestamp ) "
            + " values( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ";
            var params = [
              trx_id, from, to, amount, type, memo, current_num,
              block, trx_in_block, op_in_trx, virtual_op, trx_timestamp
            ];
            var inRslt = query(inQry, params);
            logger.info(inRslt);
          } //if( op_type == 'transfer' ){
          else if( op_type == 'account_create' ){
            // info : {"fee":"6.000 STEEM","creator":"nhj12311","new_account_name":"steemalls","owner":{"weight_threshold":1,"account_auths":[],"key_auths":[["STM5r8XxhVZaWjqHjwqfmRpKEjfACRv2w4UQS7LrfaNQZcBE3U63i",1]]},"active":{"weight_threshold":1,"account_auths":[],"key_auths":[["STM8YGwdKDVdd6VCEiFo9914MSh57GqsZfcpYG2jpp4YAUPapXsFL",1]]},"posting":{"weight_threshold":1,"account_auths":[],"key_auths":[["STM7QkY2PCRHPB9xw4Gd42LYdVj9dGvecfFuofVMcPazRG7cNhKFw",1]]},"memo_key":"STM5PqVq1kQB6TfSad7Ahh2QSY43SCvPPKWYdiTRHzdSsaBD3CQdt","json_metadata":""}
            const fee = json_metadata.fee;
            const creator = json_metadata.creator;
            const new_account_name = json_metadata.new_account_name;
            const create_timestamp = json_metadata.timestamp;

            var selRslt = query( "select * from account_create where trx_id = ? ", [trx_id] );
            if( selRslt.length > 0 ){
              logger.warn("already saved this account_create! [" + trx_id +"]");
              continue;
            }

            var inQry = " insert into account_create "
            + " ( trx_id, creator, new_account_name , fee, trx_timestamp) "
            + " values( ?, ?, ?, ?, ? ) ";
            var params = [trx_id, creator, new_account_name, fee, trx_timestamp ];
            var inRslt = query(inQry, params );
            logger.info("save account_create : " + params.join(", "));
          }

          lastNum = transactions[idxTr][0];

        } // for(var idxTr = 0; idxTr < transactions.length;idxTr++){
        //lastNum += histLimit;
        var upRslt = query(" update acct_hist_mng set last_num = ? where acct_nm = ? " , [ lastNum , mngList[idxMng].acct_nm] );
      }
    }catch(err){
      logger.error(err, "WalletBot Error!");
    }finally{
      setTimeout(function(){walletBot()}, walletTerm );
    }
  });
}



// account_create_bot start
//
//
function getCreateAccountFee(){
  var config = await(steem.api.getConfig( defer() ));
  //console.log( config );
  var chainProps = await(steem.api.getChainProperties( defer() ));
  var ratio = config['STEEM_CREATE_ACCOUNT_WITH_STEEM_MODIFIER'];
  //console.log(chainProps.account_creation_fee + ", " + ratio );
  var fee = ( parseFloat(chainProps.account_creation_fee.split(" ")[0]) * parseFloat(ratio) ) + "";
  if( fee.indexOf(".") == -1 ){
    fee += ".000";
  }
  var feeString = fee + " " + chainProps.account_creation_fee.split(" ")[1];
  //console.log( "feeString : " + feeString );
  return feeString;
}

var email = require('./util/email.util.js');

function account_create_bot(){
  fiber(function() {
    try{

      const fee = getCreateAccountFee();

      logger.info("account_create_bot execute. account_create fee : " + fee );

      var selQry = " select * from bot_acct_mng where 1=1 and instr(arr_dvcd, ?) > 0 ";
      var svcBotList = query(selQry, [4] );
      for( var idxBot = 0; idxBot < (Array.isArray(svcBotList)?svcBotList.length:1) ; idxBot++  ){
        var botInfo = Array.isArray(svcBotList) ? svcBotList[idxBot] : svcBotList;
        //logger.info(botInfo);

        selQry = " select * from transfer where 1=1 and wrk_status = 1 and transfer_type = 'STEEM' and to_acct = ? order by reg_dttm asc "; // 1 : wait, 0 : complete, 9 : error
        var wrkObjList = query(selQry , [botInfo.id] );
        logger.info( "transfer list : " + wrkObjList.length  );
        for( var idxWrk = 0; idxWrk < (Array.isArray(wrkObjList)?wrkObjList.length:1) ; idxWrk++  ){
          var wrkInfo = Array.isArray(wrkObjList) ? wrkObjList[idxWrk] : wrkObjList;
          logger.info( wrkInfo );
          var wrkStatus = 1;
          var wrkMsg;
          var mailto;
          try{
            let memo = wrkInfo.memo;
            if( memo.trim().substring(0, 1) == "#" ){
              memo = steem.memo.decode( botInfo.memo_key , memo);
              memo = memo.substring(1);
              logger.info("[decode memo] : "+memo);
            }
            memo = memo.replace(/\'/gi, "\"");
            logger.info(memo);
            // let arrMemo;
            // if( memo.indexOf("=") > -1 ){
            //   arrMemo = memo.split("=");
            // }else if( memo.indexOf(":") > -1 ){
            //   arrMemo = memo.split(":");
            // }else{
            //   wrkMsg = "':', '='의 형태는 필수입니다. ";
            //   throw new Error(wrkMsg);
            // }
            // var jsonStr = "{ ";
            // for(var idxMemo = 0; idxMemo < arrMemo.length;idxMemo++){
            //   jsonStr += " \""+arrMemo[0].trim() +"\" "
            //   if( idxMemo + 1 < arrMemo.length ){
            //     jsonStr += ":"
            //   }
            // }
            // jsonStr += "}";
            const memo_metadata = JSON.parse(memo);

            if( memo_metadata.email
              && memo_metadata.account ){
                mailto = memo_metadata.email;
                logger.info( memo_metadata );
            }else{
              var memoStr;
              if( memo.length > 200){
                memoStr = memo.substring(0, 200);
              }
              wrkMsg = "형식 맞지 않음(memo syntax error). [" + memoStr +"]";
              throw new Error(wrkMsg);
            }

            if( !email.validate(mailto) ){
              wrkMsg = "메일 주소가 유효하지 않습니다. " + mailto;
              throw new Error( wrkMsg );
            }

            if( parseFloat(wrkInfo.amount) < parseFloat( fee.split(" ")[0] ) ){
              wrkMsg = "금액이 부족함(Not Enough STEEM Amount). receipt amount : " + wrkInfo.amount +", needs fee : " + fee;
              throw new Error( wrkMsg );
            }

            // 생성 하고 이메일 발송하기!
            var creator = botInfo.id;
            const creatorWif = botInfo.active_key;
            const newAccountName = memo_metadata.account;

            var existsAccount = await(steem.api.getAccounts([newAccountName], defer()));
            if( existsAccount.length > 0 ){
              wrkMsg = "[" + newAccountName + "] This account already exists. ";
              throw new Error( wrkMsg );
            }

            var newAccountPassword = steem.formatter.createSuggestedPassword();
        		var roles = ["POSTING", "ACTIVE", "OWNER", "MEMO"];

        		var arrPublicKey = steem.auth.generateKeys(newAccountName, newAccountPassword, roles);
        		var arrPrivateKey = steem.auth.getPrivateKeys(newAccountName, newAccountPassword, roles);
            var owner = {
        			weight_threshold: 1,
        			account_auths: [],
        			key_auths: [[ arrPublicKey["OWNER"] , 1]]
        		};
        		var active = {
        			weight_threshold: 1,
        			account_auths: [],
        			key_auths: [[arrPublicKey["ACTIVE"], 1]]
        		};
        		var posting = {
        			weight_threshold: 1,
        			account_auths: [],
        			key_auths: [[arrPublicKey["POSTING"], 1]]
        		};
            var jsonMetadata = '';


            logger.info("이제 만들어줘볼까?? newAccountName : " + newAccountName + ", owner key : ["+arrPrivateKey["OWNER"]+"] ");

            var result = await(steem.broadcast.accountCreate(creatorWif, fee, creator,
      						newAccountName, owner, active, posting, arrPublicKey["MEMO"],
      						jsonMetadata, defer()));
            logger.error(result);

            wrkStatus = 0;
            wrkMsg = "생성 완료. owner key : ["+arrPrivateKey["OWNER"]+"]";

            var title = "계정 생성 성공(Account creation successful)!";
            var body = "<p style='font-size:1em;'> 아래 오너 키를 잃어버리시면 계정을 찾으실 수 없습니다. 지금 바로 스팀잇에 접속하셔서 오너키를 바로 변경해주시기 바랍니다. <br />"
            body += " (If you lose this owner key, you will not be able to find your account.) <br /><br />";
            body += "별도 사항은 <a href='https://steemit.com/@nhj12311'>@nhj12311</a> 에 문의 하실 수 있습니다. 감사합니다. <br />";
            body += "(If you have any problems, please contact us by email or blog.)";
            body += "<br /><br />";
            body += wrkMsg + " </p> ";
            email.send( mailto, title, body, function(err, res ){
              logger.error(err, res );
            });
          }catch(err){
            wrkMsg = err.message;
            logger.error( err, "create process error!" );
            wrkStatus = 9;
            if( email.validate(mailto) ){
              var title = "계정 생성 실패(Account creation failed)!";
              var body = "<p style='font-size:1em;'> 아래 사유로 계정 생성에 실패하였습니다(Account creation failed for this reason). <br />"
              body += "<a href='https://steemit.com/@nhj12311'>@nhj12311</a> 에 문의 하실 수 있습니다. ";
              body += "(If you have any problems, please contact us by email or blog.) <br /><br />";
              body += wrkMsg + "</p> ";
              email.send( mailto, title, body, function(err, res ){
                logger.error(err, res );
              });
            }

          }finally{
            var upQry = " update transfer set wrk_status = ? , wrk_msg = ? where trx_id = ? ";
            var params = [ wrkStatus, wrkMsg, wrkInfo.trx_id ];
            logger.info("update params : " + params.join(","));
            var upRslt = query(upQry, params );
            logger.info(upRslt);
          }
        } // for( var idxWrk = 0; idxWrk < (Array.isArray(wrkObjList)?wrkObjList.length:1) ; idxWrk++  ){
      } // for( var idxBot = 0; idxBot < (Array.isArray(svcBotList)?svcBotList.length:1) ; idxBot++  ){

    }catch(err){

      logger.error(err, "account_create_bot Error!");
    }finally{
      setTimeout(function(){account_create_bot()}, 30000 );
    }
  });
}



// prototype_bot
function prototype_bot(){
  fiber(function() {
    try{

    }catch(e){
      logger.error(err, "WalletBot Error!");
    }finally{
      //setTimeout(function(){prototype_bot()}, 1000 );
    }
  });
}

function startBot(){
  blockBot();
  wrkBot();
  walletBot();
  account_create_bot();
}

startBot();
