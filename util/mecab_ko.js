
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
      arrGroup[arrIdx++] = {
        word : getSeriesTitle(contents[i].title, joinWord, ' ')
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

function getSeriesTitle(org, trg, chr ){
  let _trgIdx = 0;
  let _orgIdx = 0;
  for( ; _orgIdx < org.length; _orgIdx++){
    if(org[_orgIdx] == chr ) continue;
    if( org[_orgIdx] != trg[_trgIdx++] ) {
      break;
    }
  }
  let st = org.substring(0, _orgIdx).trim();
  if(['-', '#', ',' , '!', '@', '%', ':', '*', '(', '=', '+'].includes( st.substring(st.length - 1, st.length )))
    st = st.substring(0, st.length - 1).trim();
  return st;
}


exports.getContentsByTitle = function (steem, author, title){
  let permlink = null;
  let result;
  let contents = [];
  let currentGroup = [];
  let histGroup = [];
  //fiber(function() {
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
    //console.log( idxTitle,"two." ,arrGroup );
    histGroup[idxTitle] = arrGroup;
    if(arrGroup.length > 0 && arrGroup[0].cnt > 0){
      isContinue = true;
      idxTitle++;
      currentGroup = arrGroup
    }else{
      isContinue = false;
    }
    if( idxTitle > 6) isContinue = false;
    //console.log( idxTitle, arrGroup );

  }while(isContinue)

  //console.log(currentGroup);
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
    //.log("currentGroup : ", currentGroup);
  //}); // end fiber..
  return currentGroup[0];
}
