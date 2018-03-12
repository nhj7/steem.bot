var steem = require("./test_steem.js")();
//console.log(steem);

async function test(){
  var account = await steem.api.getAccountsAsync(["nhj12311"]);
  var globalData = await steem.api.getDynamicGlobalPropertiesAsync();
  console.log(globalData);
  // Get conversion information
  var ci = new Object();
  ci.rewardfund_info = await steem.api.getRewardFundAsync( "post");
  console.log("\n");
  console.log("\n");
  console.log(ci.rewardfund_info);

  ci.price_info = await steem.api.getCurrentMedianHistoryPriceAsync();
  console.log("\n");
  console.log("\n");
  console.log(ci.price_info);

  ci.reward_balance = ci.rewardfund_info.reward_balance;
  ci.recent_claims = ci.rewardfund_info.recent_claims;
  ci.reward_pool = ci.reward_balance.replace(' STEEM', '') / ci.recent_claims;
  ci.sbd_per_steem = ci.price_info.base.replace(' SBD', '') / ci.price_info.quote.replace(' STEEM', '');

  ci.steem_per_vest = globalData.total_vesting_fund_steem.replace(' STEEM', '')
  / globalData.total_vesting_shares.replace(' VESTS', '');

  var vp = account[0].voting_power;
  var vestingSharesParts = account[0].vesting_shares.split(' ');
  var receivedSharesParts = account[0].received_vesting_shares.split(' ');
  var delegatedSharesParts = account[0].delegated_vesting_shares.split(' ');
  var totalVests = parseFloat(vestingSharesParts[0]) + parseFloat(receivedSharesParts[0]) -
    parseFloat(delegatedSharesParts[0]);
  var steempower = steem.formatter.vestToSteem(
        totalVests,
        parseFloat(globalData.total_vesting_shares),
        parseFloat(globalData.total_vesting_fund_steem)
      );
  var then = new Date(account[0].last_vote_time);
  var now = new Date();
  var seconds_since_last_vote = (now - then) / 1000;
  vp = (seconds_since_last_vote * 10000 / 86400 / 5) + account[0].voting_power;
  console.log('vp is: ' + vp);
  console.log('Total steem power is: ' + steempower);
  

}

test()
