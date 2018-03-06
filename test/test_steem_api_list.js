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
// 255
steem.api.getAccountHistory("steemalls", -1, 500, function(err, result) {
  //console.log(err, result);
  for(var i = 0; i < result.length;i++){
    //console.log("data : "+JSON.stringify(result[i][1]));
    if( result[i][1].op[0] == 'transfer' ){
      console.log("num : "+result[i][0]);
      console.log("type : "+result[i][1].op[0]);
      console.log("info : "+JSON.stringify(result[i][1].op[1]));
    }
  }
});
