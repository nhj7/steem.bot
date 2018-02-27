console.log("getMention test");
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
//console.log(steem);

steem.api.getContent("steem.apps", "re-nhj12311-4ca4rp-20180227t064436530z",
  function (err, result){
    console.log(result);
  }
);
