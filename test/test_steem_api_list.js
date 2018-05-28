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


//   url: '/kr-gazua/@lalaflor/75-120180328t062730467z#@soohyeongk/re-lalaflor-75-120180328t062730467z-20180328t062958684z',

// steem.api.getContent("soohyeongk", "re-lalaflor-75-120180328t062730467z-20180328t062958684z",
//   function(err, result ){
//     console.log(result);
//
//     text = marked.toText(result.body.replace(/@/gi, ""));
//     console.log(text);
//     text = getPreView(text, 'ryh0505', 128);
//     console.log("");
//     console.log(text);
//   }
// );
//
// var rsltValidAcctNm = steem.utils.validateAccountName('test1234');
// if( rsltValidAcctNm ){
//     console.log(rsltValidAcctNm);
// }

// 255

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

async function tmp(){
  try{
    const lmtCnt = 10000;
    let idxHist = -1;
    let arrVoter = new Array();
    let arrAuthor = new Array();
    var gprops = await steem.api.getDynamicGlobalPropertiesAsync();
    var steemPower = gprops.total_vesting_fund_steem.replace(" STEEM", "") / gprops.total_vesting_shares.replace(" VESTS", "");
    do{
      console.error(idxHist, lmtCnt);
      var result = await steem.api.getAccountHistoryAsync("nhj12311", idxHist, lmtCnt);
      console.error(result.length, result[0][0] + '~' + result[result.length-1][0]);
      var totDoVotingVal = {};
      var totRcvVotingVal = {};
      for(var i = 0; i < result.length;i++){

        if( result[i][1].op[0] == 'vote' ){
          var t = result[i][1].timestamp.replace("T"," ").split(/[- :]/);
          var d = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
          var offset = d.getTimezoneOffset() / 60;
          var hours = d.getHours();
          d.setHours(hours - offset);

<<<<<<< HEAD
          /*

=======
>>>>>>> 8d022227bc632c6f5a2522c9303718e1d56c483f
          console.log("date : "+(result[i][1].timestamp), d);
          console.log("num : "+result[i][0]);
          console.log("type : "+result[i][1].op[0]);
          console.log("info : "+JSON.stringify(result[i][1].op[1]));

<<<<<<< HEAD
          */

=======
>>>>>>> 8d022227bc632c6f5a2522c9303718e1d56c483f
          arrVoter.push(result[i][1].op[1].voter);
          arrAuthor.push(result[i][1].op[1].author);

          if( result[i][1].op[1].voter == "nhj12311"){
            if( !totDoVotingVal[result[i][1].op[1].author] ) {
              totDoVotingVal[result[i][1].op[1].author] = { totWeigt : 0, count : 0, votingList : [] };
            }
            totDoVotingVal[result[i][1].op[1].author].totWeigt += result[i][1].op[1].weight;
            totDoVotingVal[result[i][1].op[1].author].count++;
            totDoVotingVal[result[i][1].op[1].author].votingList.push( (result[i][1].op[1]) );
          }else{
            if( !totRcvVotingVal[result[i][1].op[1].voter] ) {
              totRcvVotingVal[result[i][1].op[1].voter] = { totWeigt : 0, count : 0 , votingList : []};
            }
            totRcvVotingVal[result[i][1].op[1].voter].totWeigt += result[i][1].op[1].weight;
            totRcvVotingVal[result[i][1].op[1].voter].count++;
            totRcvVotingVal[result[i][1].op[1].voter].votingList.push( (result[i][1].op[1]) );
          }
        }
      }
      idxHist = result[0][0]-1;
    }while( result.length >= lmtCnt)

    console.error("totRcvVotingVal", totRcvVotingVal);
    console.error("totDoVotingVal", totDoVotingVal);
    var arrUniqueAuthor = arrAuthor.filter(onlyUnique);
    //console.error("arrVoter after fileter.", arrVoter.length, arrVoter);
    //console.error("arrVoterObj", arrVoterObj);

    var arrRangeSp = [ 0, 1000, 5000, 10000 ];
    var objRangeGrp = {};
    for(let i = 0; i < arrRangeSp.length;i++){
      objRangeGrp[arrRangeSp[i]] = { totWeigt : 0, count : 0, voteList : [] };
    }
    var accounts = await steem.api.getAccountsAsync(arrUniqueAuthor);
    for(let i = 0; i < accounts.length;i++){
      var userTotalVest = parseInt(accounts[i].vesting_shares.replace(" VESTS", ""))
      - parseInt(accounts[i].delegated_vesting_shares.replace(" VESTS", ""))
      + parseInt(accounts[i].received_vesting_shares.replace(" VESTS", ""));
      let acct_sp_tot = Math.floor(userTotalVest * steemPower);
      accounts[i].acct_sp_tot = acct_sp_tot;
      for(let spIdx = arrRangeSp.length; spIdx >= 0;spIdx--){
        //console.error(acct_sp_tot, arrRangeSp[spIdx]);
        if( acct_sp_tot >= arrRangeSp[spIdx] ){
          //objRangeGrp[arrRangeSp[spIdx]].push( accounts[i].name );
          objRangeGrp[arrRangeSp[spIdx]].totWeigt += totDoVotingVal[accounts[i].name].totWeigt;
          objRangeGrp[arrRangeSp[spIdx]].count++;
          objRangeGrp[arrRangeSp[spIdx]].voteList.push(
            {account : accounts[i].name, info : totDoVotingVal[accounts[i].name] }
          );
          break;
        }
      }
    }
    //console.error("accounts", accounts);
    console.error("objRangeGrp", objRangeGrp);
    console.error("objRangeGrp[0]", objRangeGrp[0]);
    console.error("objRangeGrp[0]", objRangeGrp[0].voteList[0].info);


  }catch(err){
    console.error("async function tmp() error!", err);
  }finally{

  }

}

tmp();

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

// const request = require('request');
// request("https://steemdb.com/api/accounts?account=nhj12311", function(error, res, body){
//   console.log(body);
// });



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
