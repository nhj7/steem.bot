var request = require('request');

const iconv = require('iconv-lite') //인코딩을 변환 해주는 모듈, 필자는 iconv보다 iconv-lite를 선호한다.
const charset = require('charset') //해당 사이트의 charset값을 알 수 있게 해준다.
const qs = require('querystring');
const cheerio = require('cheerio');

const queryString = "site:steemit.com twinbraid 비잔틴";
const queryStringEscape = qs.escape(queryString);
console.log(queryStringEscape);
const url = 'https://www.google.co.kr/search?newwindow=1&q='+queryStringEscape+'&oq='+queryStringEscape;
const arrQs = queryString.split(" ");

const items = new Array();
request({url:url, encoding:null}, function(error, res, body){
    if (error) {throw error};
    const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
    const html = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩
    var $ = cheerio.load(html);
    $('.g').each(function(idx){
        const doc = $(this);
        const title = doc.find("a").text().replace("— Steemit저장된 페이지","");
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
        var item = {
          link : "/" + hrefSplit1[5] + "/" + hrefSplit1[6].split("&")[0]
          , author : hrefSplit1[5]
          , permlink : permlink
          , title : title
          , st : st
        };
        items.push(item);
    })
    console.log(items);
}); // end _requested
