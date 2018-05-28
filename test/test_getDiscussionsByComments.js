var steem = require("./test_steem.js")();
var author = 'nhj12311';

async function getDiscussionsByComments(){
    var result = await steem.api.getDiscussionsByCommentsAsync({ start_author : author, limit: 30});
    console.log(result);
}

getDiscussionsByComments();
