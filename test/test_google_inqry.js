
// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!
const request = require('request');
const iconv = require('iconv-lite') //인코딩을 변환 해주는 모듈, 필자는 iconv보다 iconv-lite를 선호한다.
const charset = require('charset') //해당 사이트의 charset값을 알 수 있게 해준다.
const qs = require('querystring');
const cheerio = require('cheerio');

function awaitRequest(param, callback){
  request(param, function(error, res, body){
    var data = { res : res, body : body };
    callback(error, data );
  });
}

var Fiber = require('fibers');
function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield();
}

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


function inqryGoogle( query ){
  const queryString = "site:steemit.com " + query;
  console.log(queryString);
  const queryStringEscape = qs.escape(queryString);
  console.log(queryStringEscape);
  const items = new Array();
  const arrQs = queryString.split(" ");
  fiber(function() {
  for(var i = 0; i < 1 ; i++){
  const url = 'https://www.google.co.kr/search?newwindow=1&q='+queryStringEscape+'&oq='+queryStringEscape+"";
  //const url = 'https://www.google.co.kr/search?newwindow=1&ei=YP2VWrelLYXP0ATD1ZX4Dg&q=site%3Asteemit.com%20%EB%B9%84%ED%8A%B8%EC%BD%94%EC%9D%B8&oq=site%3Asteemit.com%20%EB%B9%84%ED%8A%B8%EC%BD%94%EC%9D%B8&gs_l=psy-ab.12...0.0.0.784.0.0.0.0.0.0.0.0..0.0....0...1c..64.psy-ab..0.0.0....0.V3q3S6QPY6Q';
  try{
    var result = await(awaitRequest({url:url, encoding : null }, defer() ));
    //console.log(result);
    var error = result.error;
    var res = result.res;
    var body = result.body;
    if (error) {throw error};
    const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
    const html = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩
    console.log(html);
    var $ = cheerio.load(html);
    $('.g').each(function(idx){
        const doc = $(this);
        let title = doc.find("a").text().replace("— Steemit저장된 페이지","");
        if( title ==  queryString + " 관련 이미지" ){
          return;
        }
        const href = doc.find("a").attr("href");
        const href_unescape = qs.unescape(href);
        const hrefSplit1 = href_unescape.split("/");
        let st = doc.find(".st").text().replace(/\n/gi, "");
        for(var i = 1; i < arrQs.length ;i++){
          var re = new RegExp(arrQs[i],"gi");
          st = st.replace(re, "<b>"+arrQs[i]+"</b>");
          title = title.replace(re, "<b>"+arrQs[i]+"</b>");
        }
        if(hrefSplit1.length < 6 || hrefSplit1[5].indexOf("@") == -1 ){
          return;
        }
        const permlink = hrefSplit1[6].split("&")[0];
        //console.log(idx + " 검색결과 " + doc.html());
        //console.log(idx + " 링크 " + href_unescape);
        // console.log(idx + " 계정 " + hrefSplit1[5]); // account name
        // console.log(idx + " permlink " + permlink); // permlink
        // console.log(idx + " 제목 " + title);
        // console.log(idx + " 요약 " + st);
        var doorImg = "";

        // var post = await(steem.api.getContent(hrefSplit1[5].substring(1), permlink, defer()));
        // console.log(post);
        // if(post.json_metadata){
        //   const json_metadata = JSON.parse(post.json_metadata);
        //   if( json_metadata.image && json_metadata.image.length > 0 ){
        //     doorImg = json_metadata.image[0];
        //   }
        // }

        var item = {
          link : "/" + hrefSplit1[5] + "/" + hrefSplit1[6].split("&")[0]
          , author : hrefSplit1[5]
          , permlink : permlink
          , title : title
          , st : st
          , avatar : "https://steemitimages.com/u/"+hrefSplit1[5].substring(1)+"/avatar"
        };
        items.push(item);
    })
  }catch(e){
    console.log("e : "+e);
  }
  sleep(500);
  } // for


  console.log(items);
  return items;
  }); // fibers...
}

inqryGoogle("비트코인");
