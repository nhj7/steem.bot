


function getPreView(body, author, lmtLen){
  var idxAuthor = body.indexOf(author);
  var cmnt = body.substring(idxAuthor, idxAuthor + author.length);
  for(var i = 1; i <= lmtLen ;i++){
    if( idxAuthor - i > 0 )
      cmnt = body[idxAuthor - i] + cmnt;
    if( idxAuthor + author.length + i < body.length )
      cmnt = cmnt + body[idxAuthor + author.length+ i];
    console.error(cmnt.length);
    if( cmnt.length >= lmtLen){
      if( idxAuthor - i > 0 ){
        cmnt = "..."+cmnt;
      }
      console.error(idxAuthor + author.length+ i, body.length)
      if( idxAuthor + author.length+ i < body.length ){
        cmnt = cmnt + "...";
      }
      break;
    }

  }
  return cmnt;
}


var body = " 닳도록 하느님이 보우하사 우리나라 만세  닳도록 하느님이 보우하사 우리나라 만세 무궁화 삼천리 화려강산 대한사람 대한으로 길이 보전하세. @minming님 만세 남산 위에 저 소나무 철갑을 두른듯 바람서리 불변함은 우리기상일세 무궁화 삼천리 화려강산 대한사람 대한으로 길이보전하세~";

var cmnt = getPreView(body, "minming", 128);

console.log(cmnt);
