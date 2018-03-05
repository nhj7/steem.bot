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
//console.log(steem.api);


// steem.api.getContent("umkin", "2cebzz",
//   function(err, result ){
//     console.log(result);
//   }
// );
steem.api.getAccountHistory("steem.apps", -1, 100, function(err, result) {
  console.log(err, result);
});
