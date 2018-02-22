// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!

var steem = require("steem")
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
console.log(arrNode);


var Fiber = require('fibers');
function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield();
}

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

var sleepTm = 1000;
function blockBot(){
  var release = steem.api.streamBlockNumber('head',function(err, blockNumber){
    fiber(function() {
      if( err != null ){  // 에러가 나는 경우
        cntNodeErr++;
        console.error(err);
        console.error(blockNumber);
        release(); // 반환하고
        console.error("1초 쉬고...");
        sleep(sleepTm);
        rotateNode();
        console.error("설정 노드 : " + arrNode[idxNode] +" blockBot 실행!");
        blockBot();
      }else{
        cntNodeErr = 0;
        console.info(blockNumber);
      }
    }); // fiber end.
  });
}
blockBot();
