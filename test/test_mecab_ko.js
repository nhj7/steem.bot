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

fiber(function() {

var result =

//getContentsByTitle('forhappywomen', '임·준·출 20화 - 20화에는 뭘할까요??')
//getContentsByTitle('keepit', 'KEEP!T Column: 실생활 속 블록체인 (3) -');
//getContentsByTitle('tanama', '[daily] 2018년 9월 22일');

getContentsByTitle('anpigon', '파이썬 머신러닝 #3 - 스팀잇 아이디로 성별  예측하기');

//getContentsByTitle('ayogom', '[ 하생시 ] 18.09.22 나의.');

//getContentsByTitle('zinasura', '창세기전3 파트2 영혼의 검 14화');

//getContentsByTitle('yoon', '[부동산이야기] 대체 집값은 언제까지 오르는걸까?')

//getContentsByTitle('jjy', 'steem essay @jjy의 샘이 깊은 물 - 맛나는 점심.')

//getContentsByTitle('khaiyoui', '[카일의 수다#100]나도 북스팀7 - 아침이 온다 (츠지무라 미즈키)')

//getContentsByTitle('clayop', '[토큰 이코노미 풀어내기] 10. 워킹 모델')

//getContentsByTitle('kyslmate', '[동화] 아웃렛 (8th.)')

//getContentsByTitle('nhj12311', '[개발] 스팀잇 본문 마크다운 뷰어 만들기 #1 - 태그와 멘션에 링크 걸기.')
//getContentsByTitle('keepit', 'KEEP!T 블록체인 뉴스: 9/24 - 비트코인 코어 - 심각한 네트워크 충돌 취약성, 석유 대기업과 메이저 은행 - 이더리움 블록체인 활용')
if( result ){
  console.log('result : ', result['word'], result['contents']);
  console.log('result : ', result.word, result.contents);
}else{
  console.log('result 0');
}

}); // end fiber..
