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

var sleepTm = 1000;
var pc = "@"; // pre command
var epc = "!"; // pre command
var nl = "\r\n";  // new line

// module init
const winston = require('winston');
require('winston-daily-rotate-file');

// module end

// winston log init!
const tsFormat = () => (new Date()).toLocaleTimeString();

console.log("tsFormat : " + tsFormat);
const logPath = '/log/steem_nhj/';
const logger = new (winston.Logger)({
   transports: [
     new (winston.transports.Console)({ timestamp: tsFormat }),
     new (winston.transports.DailyRotateFile)({
          // filename property 지정
          name : 'log'
          , filename: logPath + 'console.log'
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
         , filename: logPath + 'error.log'
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


require('dotenv').config();
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
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
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

function mergeSvcAcctMng(dvcd, acct_nm, permlink, useYn, option){
  var selQry = "select * from svc_acct_mng where dvcd = "+dvcd+" and acct_nm = '"+ acct_nm +"' ";
  //logger.info("selQry : " + selQry);
  var selRslt = (query(selQry ));
  //logger.info(selRslt);
  var regQry = "";
  // 있으면 업데이트
  if( selRslt.length > 0 ){
    regQry = "update svc_acct_mng set use_yn = '"+ useYn +"' , permlink = '" + permlink + "' , svc_option = '"+option+"' where dvcd = "+dvcd+" and acct_nm = '"+ acct_nm +"' ";
  }else{  // 없으면 등록!!!
    regQry = "insert into svc_acct_mng ( dvcd, acct_nm, permlink, use_yn, svc_option ) values ("+dvcd+", '"+ acct_nm +"', '" + permlink + "', '"+useYn+"', '"+option+"' ) ";
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

function parseCommand(patternOption, body, cmdKo, cmdEn){
  var cmdPatternKo = pc+cmdKo + " " + patternOption;
  var cmdPatternEn = epc+cmdEn + " " + patternOption;
  var regExpKo = new RegExp(cmdPatternKo);
  var regExpEn = new RegExp(cmdPatternEn);

  var rsltMatch = body.match(regExpKo);
  if( !rsltMatch || rsltMatch.length == 0 ){
    rsltMatch = body.match(regExpEn);
  }
  if( rsltMatch && rsltMatch.length > 0 ){
      return ( rsltMatch[0].match(patternOption)[0] );
  }else{
    return "";
  }
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

function saveMention(src_author , trg_author, title, full_link, post_author, pre_body ){
  var selQry = " select * from mention where 1=1 and src_author = ? and trg_author = ? and full_link = ? ";
  var selRslt = query( selQry , [src_author , trg_author, full_link] );
  if( selRslt.length > 0 ) return; // exists return!
  var inQry = " insert into mention(src_author , trg_author, title, full_link, post_author, pre_body ) values(?, ?, ?, ?, ?, ? ) ";
  var inRslt = query(inQry, [src_author , trg_author, title, full_link, post_author, pre_body] );
  return inRslt;
}

var marked = require('./util/marked.util.js');

function getPreView(body, author, lmtLen){
  var idxAuthor = body.indexOf(author);
  var cmnt = body.substring(idxAuthor, idxAuthor + author.length);
  for(var i = 1; i <= lmtLen ;i++){
    if( idxAuthor - i > 0 )
      cmnt = body[idxAuthor - i] + cmnt;
    if( idxAuthor + author.length + i < body.length )
      cmnt = cmnt + body[idxAuthor + author.length+ i];
    if( cmnt.length >= lmtLen){
      if( idxAuthor - i > 0 ){
        cmnt = "..."+cmnt;
      }
      if( idxAuthor + author.length+ i < body.length ){
        cmnt = cmnt + "...";
      }
      break;
    }
  }
  return cmnt;
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

  var post = await(steem.api.getContent(source.author, source.permlink, defer()));
  //logger.info(source);
  //logger.info(target);
  var originalPost;
  if( source.parent_author != "" ){
    var originalPost = getTopParentContent( source.author, source.permlink );
  }else{
    originalPost = source;
  }
  var comment = "![](https://steemitimages.com/32x32/https://steemitimages.com/u/"+source.author+"/avatar) ["+ source.author + "](/@"+source.author+")님이 ";
  comment += target.acct_nm + "님을 멘션하셨습니당. 아래 링크를 누르시면 연결되용~ ^^ <br />";

  // var pull_link = (originalPost.category ? "/"+originalPost.category:"" ) +"/@"+originalPost.author+"/"+originalPost.permlink;
  // if( originalPost.permlink !=  source.permlink ){
  //   pull_link += "#@" + source.author+"/"+source.permlink ;
  // }
  logger.error(source);
  var pull_link = post.url;
  comment += ("["+originalPost.author+"](/@"+originalPost.author+")님의 ["+ originalPost.title + "](" + pull_link +") <br /> ");
  var bodyText = marked.toText( post.body ).replace(/@/gi, "");
  var lmtLen = 128;
  if( bodyText.length > lmtLen ){
    bodyText = getPreView(bodyText, target.acct_nm, lmtLen);
  }
  comment += "\n\r <blockquote>" + bodyText + "</blockquote>";
  //logger.info(comment);
  // var reples = await(steem.api.getContentReplies(lastCmnt[0].author, lastCmnt[0].permlink, defer()));
  // for(var rpIdx = 0; rpIdx < reples.length;rpIdx++){
  //     if( reples[rpIdx].body.indexOf(pull_link) > -1 ){
  //       return;
  //     }
  // }
  //logger.error("target.svc_option : "+target.svc_option);
  if( target.svc_option != ""){
    logger.info("saveMention!!!!");
    saveMention(
      source.author // src_author
      , target.acct_nm  // trg_author
      , originalPost.title  // title
      , pull_link // pull link
      , originalPost.author // post_author
      , bodyText  // body
    );
  }else{
    logger.info(comment);
    var lastCmnt = getLastComment(target.acct_nm);
    //logger.error(lastCmnt);
    if( lastCmnt.length == 0 ) return;
    logger.info("lastCmnt : "+lastCmnt.title);
    insertWrkList(lastCmnt[0].author, lastCmnt[0].permlink, comment, source.author, source.permlink);
  }
}

function getLastComment(author){
  var lastCmnt = await(steem.api.getDiscussionsByAuthorBeforeDate(author, null, '2100-01-01T00:00:00', 1, defer()));
  if( lastCmnt.length == 0 ){
    lastCmnt = await(steem.api.getDiscussionsByComments({ start_author : author, limit: 1}, defer()));
  }
  return lastCmnt;
}

var mecab = require("./util/mecab_ko.js");
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
        logger.info( 'lastBlockNumber : ' + lastBlockNumber + ", workBlockNumber : " + workBlockNumber);
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
                let tags = [];
                if( operation[1].json_metadata ){
                  var jsonMetadata = JSON.parse( operation[1].json_metadata );
                  tags = jsonMetadata.tags;
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

                var comment = "";
                if( operation[1].parent_author != ""){ // 댓글만
                  var useYn = "";
                  var dvcd = "";
                  var cmdOption = "";
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
                      var useYn = getUseYn(operation[1].body, "멘션", "mention" );  // body, ko, en
                      if(useYn==""){
                        // 없으면 넘김.
                        logger.info("comment continue");
                        continue;
                      }
                      cmdOption = parseCommand( "[0-9]{1,2} [0-9]{1,2} [0-9]{1,2}", operation[1].body , "멘션 등록", "mention reg");
                      dvcd = "2";
                      var comment = "멘션 댓글 안내 서비스가 " +  ( useYn == "Y" ? "등록되었습니당." : "해제되었습니당." );
                      if( cmdOption != ""){
                        var arrCmd = cmdOption.split(" ");
                        if( parseInt(arrCmd[0]) == 24 && parseInt(arrCmd[1]) <= 24 && parseInt(arrCmd[2]) <= 60 ){
                          comment += "<br />이제 매일 " + arrCmd[1] + "시 " +arrCmd[2]+"분에 멘션 알림 댓글을 받으실 수 있습니당~";
                        }
                        else if( parseInt(arrCmd[0]) < 24 && parseInt(arrCmd[1]) <= 60 && parseInt(arrCmd[2]) <= 60 ){
                          comment += "<br />이제 매 " + arrCmd[0] + "시간 " +arrCmd[1]+"분 마다 멘션 알림 댓글을 받으실 수 있습니당~";
                        }
                        else{
                          cmdOption = "";
                          comment += "<br />멘션 스케줄 등록 방법은 하루에 한번 오후 18시 30분에 받고 싶은 기준으로는 `24 18 30`과 같이 입력하면 됩니다.";
                          comment += " 매 3시간 30분마다 받고 싶으신 경우는 `3 30 00`처럼 입력해주시면 됩니당~.";
                        }
                      }
                    }// end mention
                    else if( operation[1].body.contains( [ pc + "시리즈", epc + "series"] )) {
                      comment = getSeriesComment(operation[1].author, operation[1].permlink);
                      console.log('시리즈 결과', comment);
                    }
                    if( dvcd != "" )
                        mergeSvcAcctMng(dvcd, operation[1].author, operation[1].permlink, useYn, cmdOption);

                }   // if( operation[1].parent_author != ""){ // 댓글만
                else{
                  const isTagSeries = (tags && tags.includes("series-bot"))
                  if( isTagSeries ){
                    comment = getSeriesComment(operation[1].author, operation[1].permlink);
                  }
                }
                if( comment != "" ){
                    insertWrkList( operation[1].author, operation[1].permlink, comment);
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

function getSeriesComment(author, permlink){
  var postInfo = getTopParentContent(author, permlink);
  //logger.error('시리즈 안내', permlink, postInfo.author, postInfo.title );
  var contents = mecab.getContentsByTitle(steem, postInfo.author, postInfo.title );
  //logger.error('시리즈 결과' , contents );
  let comment;

  if( contents && contents.contents && contents.contents.length > 0 ){
    comment = postInfo.author+"님의 글 검색 결과 '" +  contents.word + "' 시리즈가 총 "+ (contents.cnt+1) +"건 검색되었습니다. <br />"+nl;

    let listStr;
    listStr += "|"+nl;
    listStr += "--|"+nl;

    let idxCur = 0;
    for(let i = 0; i < contents.contents.length;i++){
      if( postInfo.permlink == contents.contents[i].permlink ) idxCur = i;
      listStr += "<sup>[" + contents.contents[i].title+ "](/@"+ postInfo.author +"/"+ contents.contents[i].permlink
              + "), [[Busy 링크]](https://busy.org/@"+postInfo.author +"/"+ contents.contents[i].permlink+") "+
              (postInfo.permlink == contents.contents[i].permlink ? "<div class='phishy'>(현재글)</div>":"")+"</sup>| "+nl;
      if( i == 2000 ) {
        listStr += "과거 건까지 전부 필요하신 경우";
        break;
      }
    } // end for

    if( idxCur > 0 ){
      comment += '이전 글 : [' + contents.contents[ idxCur - 1].title + '](/@'+postInfo.author+'/'+contents.contents[idxCur - 1].permlink+')' + nl ;
    }
    if( idxCur < contents.contents.length-1 ){
      comment += '다음 글 : [' + contents.contents[ idxCur + 1].title + '](/@'+postInfo.author+'/'+contents.contents[idxCur + 1].permlink+')' + nl ;
    }
    comment += nl + listStr;

  } // end if( contents.contents.length > 0 ){
  else{
    comment = "아쉽게도 시리즈가 검색되지 않았네요. 관련 서비스가 이상하거나 추가 제안이 있다면 이 서비스 개발자 [@nhj12311](/@nhj12311)에게 문의해보면 좋지 않을까여? ";
  }
  return comment;
}
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
          + " and last_comment_dttm < DATE_ADD(now(), INTERVAL - 7 second) "
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
          var jsonMetadata = {
            "app" : "steem.apps/0.1"
            , "format" : "markdown"

          };

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
          var weight = vpow>95?60:30; // 100%
          weight = weight * 100;

          var post = await(steem.api.getContent(parentAuthor, parentPermlink, defer()));
          var created = new Date(post.created)
          var beforeDate = new Date();
          beforeDate.setDate( beforeDate.getDate() -5 );
          var isVote = false;
          for(var idxVote = 0; idxVote < post.active_votes.length ;idxVote++){
            if(botList[i].id == post.active_votes[idxVote].voter) {
              isVote = true; break;
            }
          }
          if( vpow > 89 && beforeDate <  created && !isVote ){
            let self_weight = weight * 0.4;
            var votRslt = await(steem.broadcast.vote(wif, botList[i].id, parentAuthor, parentPermlink, weight - self_weight, defer() ));
            logger.info('vote1!', votRslt);
            sleep(3500);
            try{
                steem.broadcast.vote(wif, botList[i].id, author, permlink, self_weight, function(err1, result1) { logger.info('vote2!', err1, result1); });
            }catch(e){
              logger.error(e);
            }
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
function getCreateAccountFee(){
  var config = await(steem.api.getConfig( defer() ));
  //console.log( config );
  var chainProps = await(steem.api.getChainProperties( defer() ));
  var ratio = config['STEEM_CREATE_ACCOUNT_WITH_STEEM_MODIFIER'];
  ratio = 1;
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

            var rsltValidAcctNm = steem.utils.validateAccountName(newAccountName);
            if( rsltValidAcctNm ){
                wrkMsg = ("This account name is invalid." + rsltValidAcctNm );
                throw new Error( wrkMsg );
            }

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
            if( process.env.NODE_ENV == 'development' ){
            }else{
              var result = await(steem.broadcast.accountCreate(creatorWif, fee, creator,
                    newAccountName, owner, active, posting, arrPublicKey["MEMO"],
                    jsonMetadata, defer()));
              logger.error(result);
            }
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

var moment = require('moment');

// mentionBot
function mentionBot(){
  fiber(function() {
    try{
      var mentionChkQry =
      `SELECT
      	ACCT_NM
      	, SVC_OPTION
      	, MP
      	, CASE WHEN OP1 = 24 THEN 0 ELSE OP1 END AS OP1
      	, OP2
      	, OP3
      	, date_format(now(),'%H:%i:%s')
      FROM (
      	SELECT
      		ACCT_NM
      		, SVC_OPTION
      		, MP
      		, SUBSTRING_INDEX(SUBSTRING_INDEX( SVC_OPTION , ' ', 1), ' ', -1) * A.MP AS OP1
      		, SUBSTRING_INDEX(SUBSTRING_INDEX( SVC_OPTION , ' ', 2), ' ', -1)	AS OP2
      		, SUBSTRING_INDEX(SUBSTRING_INDEX( SVC_OPTION , ' ', 3), ' ', -1)	AS OP3
      	FROM svc_acct_mng
      	INNER JOIN (
      		SELECT 1 AS MP UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
      		SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION
      		SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION
      		SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION
      		SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
      	) A
      	WHERE DVCD = 2
      	AND SVC_OPTION <> ''
      	AND SUBSTRING_INDEX(SUBSTRING_INDEX( SVC_OPTION , ' ', 1), ' ', -1) * A.MP <= 24
      ) TMP
      WHERE 1=1
      AND ((MP = 1 AND OP1 = 24 AND OP2 = date_format(now(),'%H') AND OP3 = date_format(now(),'%i') )
      		OR CASE WHEN OP1 = 24 THEN 0 ELSE OP1 END = date_format(now(),'%H') AND OP2 = date_format(now(),'%i')  )
      -- AND OP2 = date_format(now(),'%i') `;
      //console.log( mentionChkQry );
      var acctList = query(mentionChkQry);
      for( var idxAcct = 0; idxAcct < acctList.length ; idxAcct++  ){
        logger.info("metionBot : ", acctList[idxAcct] );
        var selQry = "select * from mention where 1=1 and status = 1 and trg_author = ? ";
        var mentionList = query(selQry, [ acctList[idxAcct].ACCT_NM ] );
        if( mentionList.length == 0 ){
          continue;
        }
        var comment = "안녕하세요. 멘션모아 댓글 알림입니당. <br /> <hr />\n";

        var upQry = "update mention set status = 0 where src_author = ? and trg_author = ? and full_link = ?";
        for( var idxMen = 0; idxMen < mentionList.length ; idxMen++  ){
          logger.info("metionBot : ", acctList[idxAcct].ACCT_NM + " mention "+idxMen,mentionList[idxMen] );
          comment += "![](https://steemitimages.com/32x32/https://steemitimages.com/u/"+mentionList[idxMen].src_author+"/avatar) ["+mentionList[idxMen].src_author + "](/@"+mentionList[idxMen].src_author+") : [" + mentionList[idxMen].title + "]("+mentionList[idxMen].full_link+") - "+moment(mentionList[idxMen].reg_dttm).format("HH:mm")
          comment += "\n <blockquote> " + mentionList[idxMen].pre_body + " </blockquote> <hr /> \n\n";
          query(upQry, [mentionList[idxMen].src_author, mentionList[idxMen].trg_author, mentionList[idxMen].full_link] );
        }
        var lastCmnt = getLastComment(acctList[idxAcct].ACCT_NM);
        insertWrkList(lastCmnt[0].author, lastCmnt[0].permlink, comment);
      }
    }catch(err){
      logger.error("mentionBot Error!", err);
    }finally{
      //setTimeout(function(){prototype_bot()}, 1000 );
    }
  });
}

setInterval(function(){ mentionBot() }, 59000 );  // 59초마다 수행!
