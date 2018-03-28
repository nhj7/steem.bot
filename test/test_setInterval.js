
async function test(){
  console.log("test....");
  await sleep(1500)
  console.log("test.... 2");
}
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}
setInterval( function(){ test(); }, 1000 );
