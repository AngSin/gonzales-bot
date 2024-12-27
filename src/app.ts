import {Bot, BotError} from "grammy";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvVariable";
import handleStart from "./handlers/handleStart";
import handleBuy from "./handlers/handleBuy";
import handleMessage from "./handlers/handleMessage";
import {Commands} from "./handlers/types";
import handleExport from "./handlers/handleExport";
import handleError from "./handlers/handleError";

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.catch(handleError);

bot.command("start", handleStart);


bot.on("message", handleMessage);

bot.on("callback_query:data", async (context) => {
    const callbackData = context.callbackQuery?.data;
    const userId = context.from?.id.toString();
    console.log(`Received callback query: ${callbackData} from user ${context.from.username} with user id ${userId}`);

    switch (callbackData) {
        case Commands.EXPORT:
            return handleExport(context);
        case Commands.WITHDRAW:
            return () => {};
        default:
            break;
    }

    const [direction, tokenAddress, ticker, amountInLamports] = callbackData.split(':');

    if (!direction || !callbackData.startsWith('buy:')) return;

    await handleBuy(context, tokenAddress, userId, ticker, amountInLamports);
});