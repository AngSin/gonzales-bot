import { config } from 'dotenv';
import {getMandatoryEnvVariable} from "../src/utils/getMandatoryEnvVariable";
import {Bot} from "grammy";

config();

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.api.setWebhook(getMandatoryEnvVariable('TELEGRAM_WEBHOOK_URL'));