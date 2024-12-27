import {isAddress as isEthereumAddress} from "viem";
import {PublicKey} from "@solana/web3.js";
import {Message} from "grammy/types";
import {Camelized} from "humps";
import {Context} from "grammy";

const isSolanaAddress = (address:string) => {
    try {
        const pubkey = new PublicKey(address)
        return PublicKey.isOnCurve(pubkey.toBuffer());
    } catch (error) {
        return false
    }
}

const splitBySpaceOrSlash = /[\s\/]+/;

export const getTickerFromMessage = (message: Camelized<Message>): string | undefined => {
    const words = (message.text || '').split(splitBySpaceOrSlash);
    return words.find(word => word.length > 2 && word.startsWith('$'))?.replace('$', '');
};

export const getAddressFromMessage = (message: Camelized<Message>): string | undefined => {
    const words = (message.text || '').split(splitBySpaceOrSlash);
    return words.find(word => isEthereumAddress(word) || isSolanaAddress(word));
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const oneBillion = 1_000_000_000;
const oneMillion = 1_000_000;
const oneThousand = 1_000;

const getLargestDenominator = (num: number): {denominator: number; displayUnit: string;} => {
    if (num >= oneBillion) {
        return {
            denominator: oneBillion,
            displayUnit: 'B',
        };
    }
    if (num >= oneMillion) {
        return {
            denominator: oneMillion,
            displayUnit: 'M',
        };
    }
    if (num >= oneThousand) {
        return {
            denominator: oneThousand,
            displayUnit: 'K',
        };
    }
    return { denominator: 1, displayUnit: ''};
};

export const displayHumanFriendlyNumber = (num: number): string => {
    const { denominator, displayUnit } = getLargestDenominator(num);
    const numberToDisplay = (num/denominator).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return `$${numberToDisplay} ${displayUnit}`;
}