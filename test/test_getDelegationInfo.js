var steem = require("./test_steem.js")();
var author = 'nhj12311';

async function getDelegationInfo(){
  var result = await steem.api.getVestingDelegationsAsync(author, -1, 1000);
  var gprops = await steem.api.getDynamicGlobalPropertiesAsync();
  var steemPower = gprops.total_vesting_fund_steem.replace(" STEEM", "") / gprops.total_vesting_shares.replace(" VESTS", "");
  for(var i = 0; i < result.length;i++){
    result[i].steemPower = parseInt( parseFloat(result[i].vesting_shares.replace(" VESTS", "")) * steemPower );
  }
  console.log(result);
}

getDelegationInfo();
