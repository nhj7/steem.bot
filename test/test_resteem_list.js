// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!

var steem = require("steem");

var arrNode = [
  'https://api.steemit.com'
  ,'https://steemd.dist.one'
  ,'https://rpc.dist.one'
  //,'https://steemd-int.steemit.com'
  //,'https://steemd.steemitstage.com'
  //,'https://api.steemitstage.com'
  //,'https://steemd.pevo.science'
];
var idxNode = 0;
steem.api.setOptions({url: arrNode[idxNode] });
console.log(arrNode[idxNode]);

function getTopParentInfo(author, permlink){
  var cntWhile = 0;
  while( true ){
    var result = await(steem.api.getContent(author, permlink, defer()));
    console.log( ++cntWhile + " : " + permlink );
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

function getTopParentContentReplies(author, permlink){
  var parentInfo = getTopParentInfo(author, permlink);
  var result = await(steem.api.getContentReplies(parentInfo.author, parentInfo.permlink, defer()));
  return result;
}

var nl = "\r\n";
fiber(function() {
  var author = 'nhj12311';
  var permlink = 're-lynxit-re-nhj12311-re-lynxit-re-nhj12311-re-lynxit-re-nhj12311-re-lynxit-re-nhj12311-re-lynxit-trend-20180223t023625324z';
  var postInfo = getTopParentInfo(author, permlink);
  var result = await(steem.api.getRebloggedBy(postInfo.author, postInfo.permlink, defer()));
  console.log(result);
  var idxAuthor = result.indexOf( postInfo.author );
  result.splice( idxAuthor , 1 );
  var cmntReLst = "요청하신 리스팀 리스트를 안내해드립니다. "+nl;
  cmntReLst += "리스팀 목록 | "+nl;
  cmntReLst += "-| "+nl;
  for(var i = 0; i < result.length;i++){
    cmntReLst += "@"+result[i]+"| " + nl;
  }
  console.log(cmntReLst);
});
