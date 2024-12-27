import {Bot} from "grammy";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvVariable";
import {Commands} from "./handlers/types";
import handleError from "./handlers/handleError";

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.catch(handleError);

bot.on("callback_query:data", async (context) => {
    const callbackData = context.callbackQuery?.data;
    const userId = context.from?.id.toString();
    console.log(`Received callback query: ${callbackData} from user ${context.from.username} with user id ${userId}`);

    switch (callbackData) {
        case Commands.EXPORT:
        case Commands.WITHDRAW:
            break;
        default:
            break;
    }

    const [direction, tokenAddress, ticker, num] = callbackData.split(':');

    if (!direction || !callbackData.startsWith('buy:')) return;

    if (direction === 'buy') {
        const amountInLamports = num;
    } else {
        const divider = BigInt(num);
    }
});