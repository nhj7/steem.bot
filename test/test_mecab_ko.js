var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
var mecab = require('mecab-ya');



function pos(text){
    var result = await(mecab.pos(text, defer()));
    return result;
}
function morphs(text){
    var result = await(mecab.morphs(text, defer()));
    return result;
}
function nouns(text){
    var result = await(mecab.nouns(text, defer()));
    return result;
}
function getGroup(contents, arr, idx, titleMecab){
  //console.log('getGroup.titleMecab : ', titleMecab);
  var arrGroup = []; var arrWord = []; var arrIdx = 0;
  if( titleMecab.length <= idx ) return [];
  let curTitle = titleMecab.slice(0, idx).join("");
  for (var i = 0; i < arr.length; i++) {
    if( arr[i].length <= idx ) continue;
    let joinWord = arr[i].slice(0, idx).join("");
    if( curTitle != joinWord ) continue;
    const idxHas = arrWord.indexOf(joinWord);
    if( idxHas == -1 ){
      arrWord[arrIdx] = joinWord;
      arrGroup[arrIdx++] = {
        word : joinWord
        , class : ''
        , cnt : 0
        , contents : [{
          title : contents[i].title
          , permlink : contents[i].permlink
          , created : contents[i].created
        }]
      };
    }
    else{
      arrGroup[idxHas].cnt++;
      arrGroup[idxHas].contents.push({
        title : contents[i].title
        , permlink : contents[i].permlink
        , created : contents[i].created
      });
    }
  }
  return arrGroup;
}

var steem = require("./test_steem.js")();
var author = 'nhj12311';
function getContentsByTitle(author, title){
  let permlink = null;
  let result;
  let contents = []; let currentGroup = [];

  do{
      result = await(steem.api.getDiscussionsByAuthorBeforeDate(author, permlink, '2100-01-01T00:00:00', 100, defer()));
      permlink = result[result.length-1].permlink;
      //console.log(result.length, permlink);
      contents = contents.concat(result);
  }while(result != null && result.length == 100);
  //console.log(contents.length);


  var titleMecab = morphs(title);
  var arrMecab = [];
  for(var i = 0; i < contents.length;i++){
    var resultMecab = morphs(contents[i].title);
    contents[i].mecab = resultMecab;
    arrMecab[i] = resultMecab
    //console.log(i, contents[i].title, resultMecab);
  }
  let idxTitle = 2;
  let isContinue = false;

  do{
    let arrGroup = getGroup(contents, arrMecab, idxTitle, titleMecab)

    console.log( idxTitle,"two." ,arrGroup, currentGroup[0] );
    if(arrGroup.length > 0 && arrGroup[0].cnt > 0){
      isContinue = true;
      idxTitle++;

      if( arrGroup[0].contents.length > 0
      ){
        currentGroup = arrGroup
      }
    }else{
      isContinue = false;
    }
    if( idxTitle > 6) isContinue = false;
    //console.log( idxTitle, arrGroup );
  }while(isContinue)
  try{
    console.log('currentGroup[0] : ',currentGroup[0]);
    if( currentGroup[0] && currentGroup[0]['contents'] && currentGroup[0].contents.length > 0){
      currentGroup[0].contents.sort(function(a, b){
        var a_date = new Date(a.created);
        var b_date = new Date(b.created);
        if( a_date > b_date)
          return 1;
        else if(a_date < b_date)
          return -1;
        else {
          return 0;
        }
      });
    }
  }catch(e){
    console.error("error!. ", e, currentGroup[0]);
  }
  //console.log("currentGroup : ", currentGroup,currentGroup[0].contents );
  return currentGroup[0];
}

var mecab2 = require("../util/mecab_ko.js");

fiber(function() {



var contents = mecab2.getContentsByTitle(steem, 'yong2daddy', '[Think] - 미루기는 미래의 자양분?!' );
console.error('시리즈 결과' , contents );

}); // end fiber..
