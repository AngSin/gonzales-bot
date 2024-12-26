import {Bot} from "grammy";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvVariable";
import handleStart from "./handlers/handleStart";
import handleBuy from "./handlers/handleBuy";
import handleMessage from "./handlers/handleMessage";
import handleExport from "./handlers/handleExport";

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.command("start", handleStart);

bot.command('export', handleExport);

bot.on("message", handleMessage);

bot.on("callback_query:data", async (context) => {
    const callbackData = context.callbackQuery?.data;
    const userId = context.from?.id.toString();
    console.log(`Received callback query: ${callbackData} from user ${context.from.username} with user id ${userId}`);

    const [direction, tokenAddress, ticker, amountInSOL] = callbackData.split(':');

    if (!direction || !callbackData.startsWith('buy:')) return;

    await handleBuy(context, tokenAddress, userId, ticker, amountInSOL);
});

bot.start();