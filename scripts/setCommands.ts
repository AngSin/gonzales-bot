import { config } from 'dotenv';
import {getMandatoryEnvVariable} from "../src/utils/getMandatoryEnvVariable";
import {Bot} from "grammy";

config();

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.api.setMyCommands([{ command: 'start', description: 'See details about your wallet and other available commands' }]).then(console.log).catch(console.log);