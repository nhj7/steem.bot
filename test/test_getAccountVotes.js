var steem = require("./test_steem.js")();

steem.api.getAccountVotes('virus707', function(err, result) {
  console.log(err, result);
});
