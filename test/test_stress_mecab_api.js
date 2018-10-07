var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
var mecab = require('mecab-ya');
var steem = require("./test_steem.js")();

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

function getContentsByTagToday( tag ){
  var result = [];
  var toDay = new Date();
  var start_author;
  var start_permlink;
  var isContinue = true;
  do{
    var contents = await(steem.api.getDiscussionsByCreated(
      {"tag": tag , "limit": 100, "start_author" : start_author, "start_permlink" : start_permlink }, defer() )
    )

    console.log(contents.length);
    for(let i = 0; i < contents.length;i++){
      var created = new Date(contents[i].created);
      //console.log(i, created.yyyymmdd());
      if( parseInt(toDay.yyyymmdd())-1 <= parseInt(created.yyyymmdd()) ){
        result.push(contents[i]);
        start_author = contents[i].author
        start_permlink = contents[i].permlink
      }else{
        isContinue = false;
        break;
      }
    }
  }while(isContinue);
  return result;
}

var mecab = require("../util/mecab_ko.js");
fiber(function() {
  var result = getContentsByTagToday("kr");
  //console.log(result );
  console.log(result.length + " 찾음..." );

  for(let i = 0; i < result.length;i++){
    try{
      var series = mecab.getContentsByTitle( steem , result[i].author, result[i].title );
      if( series ){
        console.log(series.contents.length + "개 찾음.", "시리즈 명 : " + series.word +" ", " 저자 : @" +result[i].author, " " , result[i].title);
      }else{
        console.log(" [관련글 없음.] ", " 저자 : @"+result[i].author, " " , result[i].title );
      }
    }catch(e){
      console.error(e, "error!!" , result[i].author,result[i].title );
    }


  }
});
