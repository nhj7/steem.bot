const path = require('path');
console.log(path.resolve(process.cwd(), '.env'));


var dotenvRslt = require('dotenv').config();
if (dotenvRslt.error) {
  console.error(dotenvRslt.error);
}
console.log(process.env.account_create_email);
