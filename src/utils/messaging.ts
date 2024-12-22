import {Pair} from "./types";
import {Context, InlineKeyboard} from "grammy";
import {capitalize} from "./string";

export const replyToMessageWithPairInfo = async (context: Context, pair: Pair) => {
    const inlineKeyboard = new InlineKeyboard().text('BUY', `buy:${pair.baseToken.address}`);
    await context.reply(
        `✍️ ${pair.baseToken.name}\n` +
        `🌐${capitalize(pair.chainId)}\n` +
        `💹$${pair.baseToken.symbol}\n\n` +
        `💰$${pair.priceUsd.toLocaleString()}\n` +
        `💎$${pair.fdv.toLocaleString()} FDV \n` +
        `📜\`${pair.baseToken.address}\`\n`,
        {
            parse_mode: "HTML",
            reply_markup: inlineKeyboard,
            reply_to_message_id: context.message?.message_id,
        }
    );
};