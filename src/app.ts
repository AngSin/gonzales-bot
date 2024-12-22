import {Bot, Context} from "grammy";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvVariable";
import {getAddressFromMessage, getTickerFromMessage} from "./utils/string";
import {searchAndRetrievePair} from "./utils/api";
import {replyToMessageWithPairInfo} from "./utils/messaging";

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

console.log('ETH and SOL Tables:', process.env.ETH_KEYS_TABLE, process.env.SOL_KEYS_TABLE);

const bot = new Bot(botToken);

bot.on("message", async (context: Context) => {
    const { message } = context;
    console.log(`Received message: ${JSON.stringify(message)}\n`);
    if (!message) return; // nothing to do here
    const ticker = getTickerFromMessage(message);
    const address = getAddressFromMessage(message);
    const addressOrTicker = address || ticker;
    if (!addressOrTicker) return;

    // message verification complete
    console.log(`Found address or ticker: ${addressOrTicker}`);
    const pair = await searchAndRetrievePair(addressOrTicker);
    console.log(`Found token pair: ${JSON.stringify(pair)}\n`);

    await replyToMessageWithPairInfo(context, pair);
});

bot.on("callback_query:data", async (context) => {
    const callbackData = context.callbackQuery?.data;
    console.log(`Received callback query: ${callbackData}`);

    if (!callbackData || !callbackData.startsWith('buy:')) return;

    const tokenAddress = callbackData.split(':')[1];

    await context.answerCallbackQuery({ text: "Processing your BUY request..." });

    await context.reply(
        `🛒 You have selected to BUY the token with address: \`${tokenAddress}\``,
        { parse_mode: "Markdown" }
    );
});


bot.start();