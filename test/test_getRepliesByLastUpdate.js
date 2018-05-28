var steem = require("./test_steem.js")();
var author = 'nhj12311';

async function getRepliesByLastUpdateAsync(){
    var result = await steem.api.getRepliesByLastUpdateAsync( author, '', 30);
    console.log(result);
}

getRepliesByLastUpdateAsync();
