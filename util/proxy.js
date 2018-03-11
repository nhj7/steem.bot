
const request = require('request');
const iconv = require('iconv-lite'); //인코딩을 변환 해주는 모듈, 필자는 iconv보다 iconv-lite를 선호한다.
const charset = require('charset'); //해당 사이트의 charset값을 알 수 있게 해준다.
const qs = require('querystring');


exports.get = function ( url , callback ) {
  var param = {url:url, encoding : null };
  request(param, function(error, res, body){
    let enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
    if( enc == null ){
      enc = "utf8";
    }
    console.log("enc : " + enc );
    body = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩
    var data = { res : res, body : body };
    callback(error, data );
  });
}

// var param = {url:"https://steemdb.com/api/accounts?account=nhj12311", encoding : null };
// request(param, function(error, res, body){
//   console.log( body );
//   let enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
//   if( enc == null ){
//     enc = "utf8";
//   }
//   body = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩
//
//   console.log(body);
//
// });
