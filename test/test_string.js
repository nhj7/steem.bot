var jsonobj = { account : 'new.account' , email : 'nhj7@naver.com' };

console.log(jsonobj);

console.log( JSON.parse(" {'account':'new.account', 'email' : 'nhj7@naver.com' } ".replace(/\'/gi, "\"") ) );



console.log( "@@".includes("@@") );
