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
//console.log(steem.api);


// steem.api.getContent("umkin", "2cebzz",
//   function(err, result ){
//     console.log(result);
//   }
// );
// 255
// steem.api.getAccountHistory("steemalls", 100, 100, function(err, result) {
//   console.log(err, result);
//   for(var i = 0; i < result.length;i++){
//     //console.log("data : "+JSON.stringify(result[i][1]));
//     //if( result[i][1].op[0] == 'transfer' ){
//       console.log("num : "+result[i][0]);
//       console.log("type : "+result[i][1].op[0]);
//       console.log("info : "+JSON.stringify(result[i][1].op[1]));
//     //}
//   }
// });

//console.log(steem.api);
// steem.api.getAccountsAsync(["nhj12311"])
// .then(function(result){
//     console.log(result);
//     var secondsago = (new Date - new Date(result[0].last_vote_time + "Z")) / 1000;
//     console.log(secondsago);
//     var vpow = result[0].voting_power + (10000 * secondsago / 432000);
//     console.log(vpow);
//     vpow = Math.min(vpow / 100, 100).toFixed(2);
//     console.log(vpow);
// });

const request = require('request');
request("https://steemdb.com/api/accounts?account=nhj12311", function(error, res, body){
  console.log(body);
});



// function getCreateAccountFee(){
//   steem.api.getConfig(function(err, config) {
//     if(err){
//       console.log(err, config);
//       throw new Error(err);
//     }
//     //console.log(err, config);
//     steem.api.getChainProperties(function(err2, chainProps) {
//       if(err2){
//         console.log(err2, chainProps);
//         throw new Error(err2);
//       }
//       //console.log(err2, chainProps);
//       var ratio = config['STEEMIT_CREATE_ACCOUNT_WITH_STEEM_MODIFIER'];
//
//       console.log(chainProps.account_creation_fee + ", " + ratio );
//
//       var fee = parseFloat(chainProps.account_creation_fee.split(" ")[0]) * parseFloat(ratio);
//       //var fee = dsteem.Asset.from(chainProps.account_creation_fee).multiply(ratio);
//
//       var feeString = fee + " " + chainProps.account_creation_fee.split(" ")[1];
//
//       console.log( "feeString : " + feeString);
//     });
//   });
// }
//
// getCreateAccountFee();
