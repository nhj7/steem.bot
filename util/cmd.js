var proxy = require("./proxy.js");

exports.wsExecute = function ( json , connection ) {
  console.log( json );
  if(  "proxy" == json.cmd ){
    proxy.get(json.url, function(err, result ){
        //console.log(result.body);
        json.body = result.body;
        connection.send( JSON.stringify(json) );
    });
  }

}
