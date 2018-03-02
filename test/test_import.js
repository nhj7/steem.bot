var conn = require("../db/db");
console.log("wait....");

var result = conn.query( "select * from bot_acct_mng ",
  function(err, result){
      console.log(result);
  }
);
