var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
var mecab = require('mecab-ya');
var text = 'Node & Steem #10 - 형태소 분석을 해보자.';

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
      arrGroup[arrIdx++] = { word : joinWord, class : '', cnt : 0, titles : [contents[i].title] , permlink : [contents[i].permlink] };
    }
    else{
      arrGroup[idxHas].cnt++;
      arrGroup[idxHas].titles.push( contents[i].title );
      arrGroup[idxHas].permlink.push( contents[i].permlink );
    }
  }
  return arrGroup;
}

var steem = require("./test_steem.js")();
var author = 'nhj12311';
async function getContentsByTitle(author, title){
  let permlink = null;
  let result;
  let contents = [];
  do{
      result = await steem.api.getDiscussionsByAuthorBeforeDateAsync(author, permlink, '2100-01-01T00:00:00', 100);
      permlink = result[result.length-1].permlink;
      console.log(result.length, permlink);
      contents = contents.concat(result);
  }while(result != null && result.length == 100);
  //console.log(contents.length);

  fiber(function() {
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
    let currentGroup = [];
    do{
      let arrGroup = getGroup(contents, arrMecab, idxTitle, titleMecab)

      //console.log( idxTitle,"two." ,arrGroup );
      if(arrGroup.length > 0){
        isContinue = true;
        idxTitle++;

        if( titleMecab[idxTitle].length > 1
            || ( currentGroup.titles && currentGroup.titles.length == arrGroup.titles.length ) ){
          currentGroup = arrGroup
        }
      }else{
        isContinue = false;
      }
      if( idxTitle > 8) isContinue = false;
      console.log( idxTitle, arrGroup );

    }while(isContinue)

    console.log("currentGroup : ", currentGroup);
    }); // end fiber..
}

//getContentsByTitle('forhappywomen', '임·준·출 20화 - 20화에는 뭘할까요??');

//getContentsByTitle('nhj12311', '[개발] 자바 언어 배우기.');

//getContentsByTitle('keepit', 'KEEP!T Column: 실생활 속 블록체인 (3) -');

//getContentsByTitle('tanama', '[daily] 2018년 9월 22일');

getContentsByTitle('ayogom', '[ 하생시 ] 18.09.22 나의.');

//getContentsByTitle('jjy', 'steem essay @jjy의 샘이 깊은 물 - 맛나는 점심.');

//getContentsByTitle('khaiyoui', '[카일의 수다#100]나도 북스팀7 - 아침이 온다 (츠지무라 미즈키)');

//getContentsByTitle('clayop', '[토큰 이코노미 풀어내기] 10. 워킹 모델');

//getContentsByTitle('kyslmate', '[동화] 아웃렛 (8th.)');
