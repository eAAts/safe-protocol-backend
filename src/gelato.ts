import { ethers } from 'ethers'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import dotenv from "dotenv";

dotenv.config();

// https://chainlist.org
// const RPC_URL = "https://polygon-rpc.com";
const RPC_URL = "https://ethereum-goerli.publicnode.com";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const signer = new ethers.Wallet(process.env.OWNER_1_PRIVATE_KEY!, provider)
const signer2 = new ethers.Wallet(process.env.OWNER_2_PRIVATE_KEY!, provider)
// const safeAddress = '0x4BD1f0331D7D3B928EB009aF9134888784f14218' // Safe from which the transaction will be sent
const safeAddress = "0xe690B47888d8a955e975215f77BC5152e05be9b0"; // latest goerli safe

// Any address can be used for destination. In this example, we use vitalik.eth
const destinationAddress = signer.address;
const withdrawAmount = ethers.utils.parseUnits('0.005', 'ether').toString()

// Create a transactions array with one transaction object
const transactions: MetaTransactionData[] = [{
    to: destinationAddress,
    data: '0x',
    value: withdrawAmount
}]
const options: MetaTransactionOptions = {
    isSponsored: true
}

const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer2
})

const main = async () => {
    const safeSDK = await Safe.create({
        ethAdapter,
        safeAddress
    });
    const relayKit = new GelatoRelayPack(process.env.GELATO_RELAY_API_KEY!)

    const safeTransaction = await relayKit.createRelayedTransaction({
        safe: safeSDK,
        transactions,
        options
    });
    
    const signedSafeTransaction = await safeSDK.signTransaction(safeTransaction)
    console.log(`signedSafeTransaction:`, signedSafeTransaction);

    const response = await relayKit.executeRelayTransaction(signedSafeTransaction, safeSDK, options)

    console.log(`Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${response.taskId}`)
}
main();