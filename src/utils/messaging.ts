import {Pair} from "./types";
import {Context} from "grammy";
import {capitalize} from "./string";

export const replyToMessageWithPairInfo = async (context: Context, pair: Pair) => {
    await context.reply(
        `✍️ ${pair.baseToken.name}\n` +
        `🌐${capitalize(pair.chainId)}\n` +
        `💹$${pair.baseToken.symbol}\n\n` +
        `💰$${pair.priceUsd.toLocaleString()}\n` +
        `💎$${pair.fdv.toLocaleString()} FDV \n` +
        `📜\`${pair.baseToken.address}\`\n`,
        {
            parse_mode: "Markdown",
            reply_to_message_id: context.message?.message_id,
        }
    );
};