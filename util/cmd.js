var proxy = require("./proxy.js");

//exports.wsExecute = function ( json , connection ) {
exports.wsExecute = function ( json , socket ) {
  console.log( json );
  if(  "proxy" == json.cmd ){
    proxy.get(json.url, function(err, result ){
        //console.log(result.body);
        json.body = result.body;
        socket.emit('io.res', json);
    });
  }
}
