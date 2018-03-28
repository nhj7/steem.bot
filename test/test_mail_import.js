
var email = require('../util/email.util.js');

var isEmail = email.validate("nhj7gmail.com");
if( isEmail ){
  console.log("");
}else{
  console.log();
}


// email.send('nhj7@naver.com', '제목임33', '내용임33', function(err, res ){
//     console.log(err, res);
// });
