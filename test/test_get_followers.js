var steem = require("./test_steem.js")();

var follower = 'nhj12311';
var startFollowing = '';
//var followType = 'blog';
var followType = 'ignore';
var limit = 999;

steem.api.getFollowing(follower, startFollowing, followType, limit, function(err, result) {
  console.log(err, result);
});

var following = 'nhj12311';
var startFollower = '';
followType = 'ignore';

steem.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
  console.log(err, result);
});
