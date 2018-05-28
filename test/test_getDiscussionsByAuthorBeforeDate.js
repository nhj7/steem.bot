var steem = require("./test_steem.js")();
var author = 'nhj12311';
steem.api.getDiscussionsByAuthorBeforeDate(author, null, '2100-01-01T00:00:00', 30, function(err, result ){
  console.log(err, result);
  for(var i = 0; i < result.length;i++){
    var payout_val = (parseFloat(result[i].total_payout_value.replace(" SBD","")) + parseFloat(result[i].pending_payout_value.replace(" SBD",""))).toFixed(2);
    console.log(result[i].title, payout_val );
  }
});
