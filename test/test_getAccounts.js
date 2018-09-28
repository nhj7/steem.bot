var steem = require("./test_steem.js")();

steem.api.getAccounts(['nhj12311'], function(err, response){
    console.log(err, response);
});
