var marked = require('marked');
console.log(marked('>hello world of mark down!'));
// &#63; to ? helper
htmlEscapeToText = function (text) {
    return text.replace(/\&\#[0-9]*;|&amp;/g, function (escapeCode) {
        if (escapeCode.match(/amp/)) {
            return '&';
        }
        return String.fromCharCode(escapeCode.match(/[0-9]+/));
    });
}
// return a custom renderer for marked.
render_plain = function () {
    var render = new marked.Renderer();
    // render just the text of a link
    render.link = function (href, title, text) {
        return text;
    };
    // render just the text of a paragraph
    render.paragraph = function (text) {
        return htmlEscapeToText(text)+'\r\n';
    };
    // render just the text of a heading element, but indecate level
    render.heading = function (text, level) {
        return text;
    };

    // render nothing for images
    render.image = function (href, title, text) {
        return '';
    };
    render.strong = function(text){
      return text;
    };
    return render;
}

md = '## This is the markdown! \r\n **it** can have [links](github.com), and images \r\n![the image](foo.png) @nhj12311';

//console.log(render_plain());
/*
<h1 id="this-is-the-markdown-">This is the markdown!</h1>
<p> it can have <a href="github.com">links</a>, and images
<img src="foo.png" alt="the image"></p>
*/

//console.log(marked(md, { renderer: render_plain() }));
// This is the markdown! it can have links, and images
exports.toHtml = function ( markdown ) {
    return marked(markdown);
}

exports.toText = function ( markdown ) {
    return marked(markdown, { renderer: render_plain() });
}
