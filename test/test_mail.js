var dotenvRslt = require('dotenv').config();
if (dotenvRslt.error) {
  console.error(dotenvRslt.error);
}
console.log(process.env.account_create_email);
console.log(process.env.account_create_password);

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
const to = 'nhj7@naver.com';
const subject = '제목입니다. ';
const html = '<p>내용입니당.</p>';

const mailOptions = {
  from,
  to,
  subject,
  html,
  // text,
};
// 본문에 html이나 text를 사용할 수 있다.

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
// 메일을 전송하는 부분
transporter.sendMail(mailOptions, (err, res) => {
  if (err) {
    console.log('failed... => ', err);
  } else {
    console.log('succeed... => ', res);
  }

  transporter.close();
});
