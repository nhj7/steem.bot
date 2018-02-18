// synchronize init!
var sync = require('synchronize');
var fiber = sync.fiber;
var await = sync.await;
var defer = sync.defer;
// synchronize init end!

var steem = require("steem")
steem.api.setOptions({url: 'https://api.steemit.com'});

console.log("hello node!!!");

//console.log(steem.api);

fiber(function() {

var result = await(steem.api.getRebloggedBy("nhj12311", "pixlr", defer()));

console.log(result);

console.log('end');
});

var release = steem.api.streamBlockNumber('head',function(err, blockNumber){
  console.log(blockNumber);
});
