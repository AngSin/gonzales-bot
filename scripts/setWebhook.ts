import { config } from 'dotenv';
import {getMandatoryEnvVariable} from "../src/utils/getMandatoryEnvVariable";
import {Bot} from "grammy";

config();

const botToken = getMandatoryEnvVariable("DEV_TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.api.setWebhook(getMandatoryEnvVariable('DEV_TELEGRAM_WEBHOOK_URL'));

bot.api.setMyCommands([{ command: 'start', description: 'See details about your wallet and other available commands' }])