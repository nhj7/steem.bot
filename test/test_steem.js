var steem = require("steem");
const arrNode = [
  'https://api.steemit.com'
  ,'https://steemd.dist.one'
  //,'https://rpc.dist.one'
  ,'https://steemd-int.steemit.com'
  ,'https://steemd.steemitstage.com'
  ,'https://api.steemitstage.com'
  //,'https://steemd.pevo.science'
];
var idxNode = 0;
steem.api.setOptions({url: arrNode[idxNode] });

module.exports = function(){

  return steem;
}
