var steem = require("./test_steem.js")();


console.log(steem);


steem.api.getDynamicGlobalProperties(function(err, response){
    console.log(err, response);
});
