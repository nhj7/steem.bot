var steem = require("./test_steem.js")();
var marked = require('marked');
var showdown = require('showdown');
var markdown = require('markdown').markdown;
var author = 'steem.apps3'
var permlink = 're-steemapps3-3lnaxo-20180925t134214661z'

var converter = new showdown.Converter();

steem.api.getContent(author, permlink, function(err, result) {
  console.log(err, result);

  // result.html = marked(result.body);
  // result.html2 = converter.makeHtml(result.body);
  // result.html3 = markdown.toHTML(result.body);


});
