var steem = require("./test_steem.js")();
var marked = require('marked');
var showdown = require('showdown');
var markdown = require('markdown').markdown;
var author = 'nhj12311'
var permlink = '7hzrge'

var converter = new showdown.Converter();

steem.api.getContent(author, permlink, function(err, result) {
  //console.log(err, result);
  result.html = marked(result.body);
  result.html2 = converter.makeHtml(result.body);
  result.html3 = markdown.toHTML(result.body);
  console.log(result);
});
