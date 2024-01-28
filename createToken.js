console.clear();
const {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TransferTransaction,
  TokenType,
  TokenSupplyType,
  TokenInfoQuery,
  AccountBalanceQuery,
  TokenMintTransaction,
  TokenBurnTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

//Grab your Hedera testnet account ID and private key from your .env file
const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.MY_PRIVATE_KEY;

const secondAccountId = process.env.SECOND_ACCOUNT_ID;
const secondPrivateKey = PrivateKey.fromStringDer(process.env.SECOND_PRIVATE_KEY);

// Vérifie si les identifiants de compte et les clés privées ont été récupérés avec succès
if (!myAccountId || !myPrivateKey || !secondAccountId || !secondPrivateKey) {
    throw new Error(
      "Environment variables MY_ACCOUNT_ID, MY_PRIVATE_KEY, SECOND_ACCOUNT_ID, and SECOND_PRIVATE_KEY must be present"
    );
  }

//Create your Hedera Testnet client
const client = Client.forTestnet();

//Set your account as the client's operator
client.setOperator(myAccountId, myPrivateKey);



const supplyKey = PrivateKey.generate();
//creation de FUNGIBLE TOKEN par l'adimn
async function createFungibleToken() {
  
    let tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("ExpertCoin")
        .setTokenSymbol("TNDC")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(10000)
        .setTreasuryAccountId(myAccountId)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(supplyKey)
        .freezeWith(client);
    
    
    //SIGN WITH TREASURY KEY
      let tokenCreateSign = await tokenCreateTx.sign(supplyKey);
      let tokenCreateSubmit = await tokenCreateSign.execute(client); //submit transaction
      let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
      
    
      console.log(`- Created token with ID: ${tokenCreateRx.tokenId} \n`);
      
      return tokenCreateRx.tokenId;
    }


    // Fonction pour transférer des jetons d'un compte à un autre
    async function transferToken(senderId, receiverId, amount, tokenId) {
      try {
        const sendToken = await new TransferTransaction()
          .addTokenTransfer(tokenId, senderId, -amount)
          .addTokenTransfer(tokenId, receiverId, amount)
          .execute(client);
    
        let receipt = await sendToken.getReceipt(client);
        console.log("Transfer Token: ", receipt.status.toString());
        console.log("The transfer token from " + senderId + " to " + receiverId + " was: " +amount+"TNDC");

        console.log("-----------------------------------");
      } catch (error) {
        console.error("Error transferring tokens:", error);
      }
    }

    async function main() {

        const tokenId = await createFungibleToken();
        await transferToken(myAccountId, secondAccountId, 100, tokenId);


         
      }
      main();