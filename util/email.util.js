var dotenvRslt = require('dotenv').config();
if (dotenvRslt.error) {
  console.error(dotenvRslt.error);
}
//console.log(process.env.account_create_email);
//console.log(process.env.account_create_password);

const nodemailer = require('nodemailer');
const smtpPool = require('nodemailer-smtp-pool');
const config = {
  mailer: {
    service: 'Gmail',
    host: 'localhost',
    port: '465',
    user: process.env.account_create_email,
    password: process.env.account_create_password,
  },
};

const from = 'steem.apps < '+process.env.account_create_email+' >';
let to = 'nhj7@naver.com';
let subject = '제목입니다. ';
let html = '<p>내용입니당.</p>';


// 본문에 html이나 text를 사용할 수 있다.

exports.validate = function(email){
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

exports.send = function (to, subject, html, callback) {
var head = "<!doctype html><html><head><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'>";
head += "<meta name='viewport' content='width=device-width, initial-scale=1'><body>";

var footer = "</body></html>";

html = head+html+footer;
console.log(html);
  const mailOptions = {
    from,
    to,
    subject,
    html,
    // text,
  };

  const transporter = nodemailer.createTransport(smtpPool({
    service: config.mailer.service,
    host: config.mailer.host,
    port: config.mailer.port,
    auth: {
      user: config.mailer.user,
      pass: config.mailer.password,
    },
    tls: {
      rejectUnauthorize: false,
    },
    maxConnections: 5,
    maxMessages: 10,
  }));

  //console.log(transporter);
  //console.log(mailOptions);
  // 메일을 전송하는 부분
  transporter.sendMail(mailOptions, (err, res) => {
    if (err) {
      console.log('failed... => ', err);
    } else {
      console.log('succeed... => ', res);
    }

    transporter.close();
    callback(err, res);
  });

};
