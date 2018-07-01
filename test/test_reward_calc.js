var steem = require("./test_steem.js")();

var author = 'nhj12311'
var permlink = 'who-mute-me'
steem.api.getActiveVotes(author, permlink, function (err, voters) {
    var reward_balance, recent_claims, basePrice, retSBD;
    var msg = "total # of voter : " + voters.length;    // voters 수를 출력
    console.log(msg);
     // 보상 풀에 있는 reward 잔액과 보상할 금액 정보 얻기
    steem.api.getRewardFund("post", function (err, rewardFund) {
        reward_balance = parseFloat(rewardFund.reward_balance.split(' '))
        recent_claims = parseInt(rewardFund.recent_claims)
        steem.api.getCurrentMedianHistoryPrice(function (err, historyPrice) {
            var basePrice = parseFloat(historyPrice.base.split(' '))
            var quotePrice = parseFloat(historyPrice.quote.split(' '))
            basePrice = basePrice / quotePrice      // feed_price 구함
            for (var i = 0; i < voters.length; i++) {   // voters 수 만큼 반복
                var rshares = parseInt(voters[i].rshares)   // i번째 voter가 준 shares 값
                // rshares를 SBD로 변환
                //retSBD = ((reward_balance / recent_claims) * basePrice * rshares).toFixed(2)
                retSBD = ((reward_balance ) * basePrice ).toFixed(2)
                var str = voters[i].voter + ' :  $' + retSBD + ' : ' + voters[i].rshares;
                console.log(str);
            }
        });
    });
});
