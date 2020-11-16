require("dotenv").config();

console.log(process.env.telegram_bot_token);

const TelegramBot = require('node-telegram-bot-api');
const telegramToken = process.env.telegram_bot_token;
let bot = new TelegramBot(token);

