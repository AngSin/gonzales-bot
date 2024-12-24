import {Keypair} from "@solana/web3.js";

const getPrivateKeyFromSecretBytes = (secret: Uint8Array) => {
    const keypair = Keypair.fromSecretKey(secret);
    return Buffer.from(keypair.secretKey).toString('base64');
}

const input = new Uint8Array([]);

console.log(getPrivateKeyFromSecretBytes(input));