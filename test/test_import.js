var test = require("./test_base");

function test(){
  fiber(function() {
    console.log("123".contains("1"));
    var result = await( conn.query( "select * from bot_acct_mng ", defer() )  );
    console.log(result);
    end();
  });
}

test.start( test );
