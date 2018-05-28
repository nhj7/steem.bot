var jsonobj = { account : 'new.account' , email : 'nhj7@naver.com' };

<<<<<<< Updated upstream
// console.log(jsonobj);
// console.log( JSON.parse(" {'account':'new.account', 'email' : 'nhj7@naver.com' } ".replace(/\'/gi, "\"") ) );
// console.log( "@@".includes("@@") );

function parseCommand(patternOption, body, cmdKo, cmdEn){
  var cmdPatternKo = cmdKo + " " + patternOption;
  var cmdPatternEn = cmdEn + " " + patternOption;
  var regExpKo = new RegExp(cmdPatternKo);
  var regExpEn = new RegExp(cmdPatternEn);

  var rsltMatch = body.match(regExpKo);
  if( !rsltMatch && rsltMatch.length == 0 ){
    rsltMatch = body.match(regExpEn);
  }
  if( rsltMatch && rsltMatch.length > 0 ){
      return ( rsltMatch[0].match(patternOption)[0] );
  }else{
    return "";
  }
}

var cmdOption = parseCommand("[0-9]{1,2} [0-9]{1,2} [0-9]{1,2}", "이렇게 좋은게 있다니...??? @멘션 등록 7 7 30 ", "@멘션 등록", "!mention reg");

console.log(cmdOption);

var undefinede;
if( undefinede )
console.log(undefinede);

console.log("@nhj12311@".replace(/@/gi, ""));
=======
//console.log(jsonobj);
//console.log( JSON.parse(" {'account':'new.account', 'email' : 'nhj7@naver.com' } ".replace(/\'/gi, "\"") ) );
//console.log( "@@".includes("@@") );

var regExpKo = new RegExp("@멘션 [ㄱ-ㅎ|ㅏ-ㅣ|가-힣]* [0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}");
var regExpEn = new RegExp("!mention [a-z]* [0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}");

console.log( "와 이런게 있었네요. @멘션 등록 3-07-30".match(regExpKo) );

console.log( "oh so good. !mention reg 3-07-30".match(regExpEn) );
>>>>>>> Stashed changes
