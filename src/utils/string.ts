import {isAddress as isEthereumAddress} from "viem";
import {PublicKey} from "@solana/web3.js";
import { Message } from "grammy/types";

const isSolanaAddress = (address:string) => {
    try {
        const pubkey = new PublicKey(address)
        return PublicKey.isOnCurve(pubkey.toBuffer());
    } catch (error) {
        return false
    }
}

export const getTickerFromMessage = (message: Message): string | undefined => {
    const words = (message.text || '').split(' ');
    return words.find(word => word.length > 2 && word.startsWith('$'))?.replace('$', '');
};

export const getAddressFromMessage = (message: Message): string | undefined => {
    const words = (message.text || '').split(' ');
    return words.find(word => isEthereumAddress(word) || isSolanaAddress(word));
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);