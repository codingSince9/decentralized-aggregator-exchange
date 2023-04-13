import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { DydxService } from './dydx.service';
import { PriceIndexService } from './price-index.service';
import { UniswapService } from './uniswap.service';


declare let require: any;
declare let window: any;

interface Dex {
  name: string;
  reserve0: number;
  reserve1: number;
}

interface TradeSize {
  liquidDex: number,
  illiquidDex: number,
  uniswap: number
}

const liquidDex = require('../../build/contracts/FullyLiquidDecentralizedExchange.json');
const illiquidDex = require('../../build/contracts/NotSoLiquidDecentralizedExchange.json');
const linkToken = require('../../build/contracts/Link.json');
const maticToken = require('../../build/contracts/Matic.json');
const sushiToken = require('../../build/contracts/Sushi.json');
const usdcToken = require('../../build/contracts/Usdc.json');
const wbtcToken = require('../../build/contracts/Wbtc.json');

// import variable from .env file
const PUBLIC_KEY8 = "0xD0D76B4C734CdEf0d66cfe3595A82538cfE6550e";
const PUBLIC_KEY9 = "0x5c8ce49DB19b2e7cd9FfD9853Cb91ba8Cf93e83f"
const PRIVATE_KEY8 = "76db17660b790ecc22ef00bbf93ce9c60989a7a9488aa6f6eb1aa948bb2513b3";
const PRIVATE_KEY9 = "2979ee37a8723c4b0870240db55f154b4f43db048bace7da227206add2d7fd0d";

@Injectable({
  providedIn: 'root'
})

export class TradeService {

  private account: any;
  private web3: any;
  private liquidDexContract: any;
  private illiquidDexContract: any;
  private linkTokenContract: any;
  private maticTokenContract: any;
  private sushiTokenContract: any;
  private usdcTokenContract: any;
  private wbtcTokenContract: any;
  private transactions: any = [];

  constructor(
    private uniswapService: UniswapService,
    private dydxService: DydxService,
    private priceIndexService: PriceIndexService
  ) { }

  getRandomTradeSize(probability: number) {
    let size: number;
    if (probability < 0.75) {
      size = Math.random() * 990 + 10;
    } else if (probability < 0.95) {
      size = Math.random() * 4000 + 1000;
    } else if (probability < 0.995) {
      size = Math.random() * 5000 + 5000;
    } else {
      size = Math.random() * 990000 + 10000;
    }
    // trim size to 5 decimal places
    size = Math.floor(size * 100000) / 100000;
    return this.web3.utils.toWei(size.toString(), 'ether');
  }

  async executeRandomTrade(dexContract: any, isLiquid: boolean) {
    const tradeAccountPublicKey = isLiquid ? PUBLIC_KEY8 : PUBLIC_KEY9;
    const tradeAccountPrivateKey = isLiquid ? PRIVATE_KEY8 : PRIVATE_KEY9;

    const tokenPair = [
      isLiquid ? this.liquidDexContract : this.illiquidDexContract,
      this.linkTokenContract,
      this.maticTokenContract,
      this.sushiTokenContract,
      this.wbtcTokenContract
    ][Math.floor(Math.random() * 5)].options.address;
    const tradeSize = this.getRandomTradeSize(Math.random());

    console.log("Trade size: " + this.web3.utils.fromWei(tradeSize, 'ether'));
    console.log("Token pair: " + tokenPair);
    if (tokenPair === this.linkTokenContract.options.address) {
      console.log("Token pair name: LINK");
    } else if (tokenPair === this.maticTokenContract.options.address) {
      console.log("Token pair name: MATIC");
    } else if (tokenPair === this.sushiTokenContract.options.address) {
      console.log("Token pair name: SUSHI");
    } else {
      console.log("Token pair name: WBTC");
    }

    // Determine whether to buy or sell
    const isBuying = Math.random() >= 0.5;

    let transactionObject = {
      from: tradeAccountPublicKey,
      to: dexContract.options.address,
      gasPrice: 20000000000,
      gas: 67210,
      value: 0,
      data: "transferData"
    };

    await this.usdcTokenContract.methods.approve(dexContract.options.address, tradeSize).send({ from: tradeAccountPublicKey, gas: 67210 });
    const daiAmount = await dexContract.methods.getAmountOut(this.usdcTokenContract.options.address, tokenPair, tradeSize).call();
    console.log("Dai amount buy: " + this.web3.utils.fromWei(daiAmount, 'ether'));
    if (isBuying) {
      transactionObject["data"] = dexContract.methods.swap(this.usdcTokenContract.options.address, tokenPair, tradeSize).encodeABI();
    } else {
      transactionObject["data"] = dexContract.methods.swap(tokenPair, this.usdcTokenContract.options.address, tradeSize).encodeABI();
    }
    const signedTransaction = await this.web3.eth.accounts.signTransaction(transactionObject, tradeAccountPrivateKey);
    const transactionReceipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log("Transaction:", transactionReceipt);
  }

  getAmountOut(reserve0: number, reserve1: number, size: number) {
    const k = reserve0 * reserve1;
    const newReserve0 = reserve0 + size;
    const newReserve1 = k / newReserve0;
    // console.log(k, typeof newReserve0, newReserve1);
    // console.log("Amount out: " + (reserve1 - newReserve1));
    return reserve1 - newReserve1;
  }

  getMostProfitableDex(dexes: Dex[], tradeSize: number) {
    let maximumOutcome = 0;
    let maximumOutcomeDex = "";
    for (let i = 0; i < dexes.length; i++) {
      // console.log("method", i);
      // console.log("Dex: " + dexes[i].name, "Reserve0: " + dexes[i].reserve0, "Reserve1: " + dexes[i].reserve1);
      let amountOut = this.getAmountOut(dexes[i].reserve0, dexes[i].reserve1, tradeSize);
      console.log("Amount out: " + amountOut);
      if (amountOut > maximumOutcome) {
        maximumOutcome = amountOut;
        maximumOutcomeDex = dexes[i].name;
      }
    }
    // maximumOutcome = this.web3.utils.toWei(maximumOutcome.toString(), 'ether');
    return { maximumOutcomeDex, maximumOutcome };
  }

  calculateTradeSizeForEachDex(dexes: Dex[], tradeSize: number, calculateAmount: boolean) {
    const STEP = 1;
    let tradeSizes: any = {
      liquidDex: 0,
      illiquidDex: 0,
      uniswap: 0
    }
    let tradeOutcomeAmount = 0;
    let leftover = 0;
    if (tradeSize >= 1) {
      for (let i = 1; i <= tradeSize; i += STEP) {
        // console.log("i: " + i, STEP);
        const { maximumOutcomeDex, maximumOutcome } = this.getMostProfitableDex(dexes, STEP);
        console.log(maximumOutcome, maximumOutcomeDex);
        tradeSizes[maximumOutcomeDex] += STEP;
        for (let j = 0; j < dexes.length; j++) {
          if (dexes[j].name === maximumOutcomeDex) {
            dexes[j].reserve0 += STEP;
            dexes[j].reserve1 -= maximumOutcome;
            tradeOutcomeAmount += Number(maximumOutcome);
            // console.log("i2: " + j, maximumOutcome);
          }
        }
        leftover = i;
      }
    }
    leftover = tradeSize - leftover;
    const { maximumOutcomeDex, maximumOutcome } = this.getMostProfitableDex(dexes, leftover);
    tradeSizes[maximumOutcomeDex] += leftover;
    tradeOutcomeAmount += Number(maximumOutcome);
    console.log("Trade sizes: ", tradeSizes);
    console.log("Trade outcome amount: ", tradeOutcomeAmount);
    console.log(typeof tradeOutcomeAmount);

    // tradeOutcomeAmount = this.web3.utils.fromWei(tradeOutcomeAmount.toString(), 'ether');
    if (calculateAmount) {
      return tradeOutcomeAmount;
    } else {
      return tradeSizes as TradeSize;
    }
  }

  async getPoolLiquidity(contract: any, token1: string, token2: string) {
    const liquidity = await contract.methods.reserves(
      this.priceIndexService.getToken(token2, true),
      this.priceIndexService.getToken(token1, true)
    ).call();
    console.log("Liquidity: " + liquidity);
    console.log(typeof liquidity);
    console.log("Liquidity: " + this.web3.utils.fromWei(liquidity, 'ether'));
    return this.web3.utils.fromWei(liquidity, 'ether');
  }

  async findBestLiquidity(buyToken: string, sellToken: string, tradeSize: number, calculateAmount: boolean) {
    let swap = false;
    let liquidDexPairLiquidity: Dex = {
      name: "liquidDex",
      reserve0: await this.getPoolLiquidity(this.liquidDexContract, buyToken, sellToken),
      reserve1: await this.getPoolLiquidity(this.liquidDexContract, sellToken, buyToken)
    }
    let illiquidDexPairLiquidity: Dex = {
      name: "illiquidDex",
      reserve0: await this.getPoolLiquidity(this.illiquidDexContract, buyToken, sellToken),
      reserve1: await this.getPoolLiquidity(this.illiquidDexContract, sellToken, buyToken)
    }
    console.log(buyToken, sellToken);
    let uniswapMarket = this.uniswapService.markets.find((m) => m.token0.symbol == buyToken && m.token1.symbol == sellToken);
    console.log(this.uniswapService.markets);
    if (!uniswapMarket) {
      console.log(uniswapMarket);
      uniswapMarket = this.uniswapService.markets.find((m) => m.token0.symbol == sellToken && m.token1.symbol == buyToken);
      swap = false;
    }
    console.log(uniswapMarket);
    let uniswapPairLiquidity: Dex = {
      name: "uniswap",
      reserve0: swap ? uniswapMarket!.reserve1 : uniswapMarket!.reserve0,
      reserve1: swap ? uniswapMarket!.reserve0 : uniswapMarket!.reserve1
    };
    console.log("uniswapPairLiquidity", uniswapPairLiquidity);
    if (swap) {
      uniswapPairLiquidity.reserve0 *= this.uniswapService.ETH_PRICE;
      uniswapPairLiquidity.reserve1 = Number(uniswapPairLiquidity.reserve1);
    } else {
      uniswapPairLiquidity.reserve0 = Number(uniswapPairLiquidity.reserve0);
      uniswapPairLiquidity.reserve1 *= this.uniswapService.ETH_PRICE;
    }
    const dexes: Dex[] = [liquidDexPairLiquidity, illiquidDexPairLiquidity, uniswapPairLiquidity];
    const percentages = this.calculateTradeSizeForEachDex(dexes, tradeSize, calculateAmount);
    return percentages;
  }

  async executeTrade(sellToken: any, buyToken: any, tradeSize: number, dexContract: any) {
    console.log("Trade size: " + tradeSize);
    console.log("Sell token: " + sellToken);
    console.log("Buy token: " + buyToken);
    console.log("Dex contract: " + dexContract);
    const sellTokenAddress = sellToken.options.address;
    const buyTokenAddress = buyToken.options.address;
    console.log("adding to transactions", this.transactions);
    console.log(this.transactions.length);
    let tx: any;

    if (dexContract) {
      const tokenAmount = await dexContract.methods.getAmountOut(sellTokenAddress, buyTokenAddress, tradeSize).call();
      console.log("Token amount to buy: " + this.web3.utils.fromWei(tokenAmount, 'ether'));
      // await sellToken.methods.approve(dexContract.options.address, tradeSize).send({ from: this.account, gas: 67210 });
      // await dexContract.methods.swap(sellTokenAddress, buyTokenAddress, tradeSize).send({ from: this.account, gas: 6721975 }),
      // dexContract.methods.swap(sellTokenAddress, buyTokenAddress, tradeSize).encodeABI();
      tx = dexContract.methods.swap(sellTokenAddress, buyTokenAddress, tradeSize).send.request({ from: this.account });
    } else {
      // Mock the trade, since we can't execute it on Uniswap
      // await buyToken.methods.approve(this.account, tradeSize).send({ from: PUBLIC_KEY9, gas: 67210 });

      let transactionObject = {
        from: PUBLIC_KEY9,
        to: this.account,
        gasPrice: 20000000000,
        gas: 67210,
        value: 0,
        data: buyToken.methods.transfer(this.account, tradeSize).encodeABI()
      };
      const signedTransaction = await this.web3.eth.accounts.signTransaction(transactionObject, PRIVATE_KEY9);
      tx = this.web3.eth.sendSignedTransaction.request(signedTransaction.rawTransaction)
      console.log("Mocked transaction: ", tx);
      // this.transactions.push(tx) 
    }
    return tx;
  }

  async tokenSwap(buyToken: string, sellToken: string, tradeSize: number) {
    let tx: any;
    const batch = new this.web3.BatchRequest();
    console.log("Buy token: " + buyToken);
    console.log("Sell token: " + sellToken);
    if (buyToken !== "USDC" && sellToken !== "USDC") {
      console.log("Both tokens are not USDC");
      const liquidityObject = await this.findBestLiquidity("USDC", sellToken, tradeSize, false);
      const liquidityObject2 = await this.findBestLiquidity(buyToken, "USDC", tradeSize, false);
      console.log("Liquidity object: ", liquidityObject);
      console.log("Liquidity object 2: ", liquidityObject2);
      for (let [exchange, dexTradeSize] of Object.entries(liquidityObject)) {
        if (exchange === "liquidDex") {
          tx = await this.executeTrade(
            this.usdcTokenContract,
            this.priceIndexService.getToken(sellToken, false),
            dexTradeSize,
            this.liquidDexContract
          );
          batch.add(tx);
        } else if (exchange === "illiquidDex") {
          tx = await this.executeTrade(
            this.usdcTokenContract,
            this.priceIndexService.getToken(sellToken, false),
            dexTradeSize,
            this.illiquidDexContract
          );
        } else if (exchange === "uniswap") {
          tx = await this.executeTrade(
            this.usdcTokenContract,
            this.priceIndexService.getToken(sellToken, false),
            dexTradeSize,
            null
          );
        }
        await tx;
        console.log("tx", tx);
        batch.add(tx);
      }
      for (let [exchange, dexTradeSize] of Object.entries(liquidityObject2)) {
        if (exchange === "liquidDex") {
          tx = await this.executeTrade(
            this.priceIndexService.getToken(sellToken, false),
            this.usdcTokenContract,
            dexTradeSize,
            this.liquidDexContract
          );
        } else if (exchange === "illiquidDex") {
          tx = await this.executeTrade(
            this.priceIndexService.getToken(sellToken, false),
            this.usdcTokenContract,
            dexTradeSize,
            this.illiquidDexContract
          );
        } else if (exchange === "uniswap") {
          tx = await this.executeTrade(
            this.priceIndexService.getToken(sellToken, false),
            this.usdcTokenContract,
            dexTradeSize,
            null
          );
        }
        await tx;
        console.log("tx", tx);
        batch.add(tx);
      }
    } else {
      const liquidityObject = await this.findBestLiquidity(buyToken, sellToken, tradeSize, false);
      console.log("Liquvidity object: ", liquidityObject);
      console.log("Buy token: ", buyToken);
      console.log("Sell token: ", sellToken);
      for (let [exchange, dexTradeSize] of Object.entries(liquidityObject)) {
        if (exchange === "liquidDex" && dexTradeSize > 0) {
          tx = await this.executeTrade(
            this.priceIndexService.getToken(sellToken, false),
            this.priceIndexService.getToken(buyToken, false),
            dexTradeSize,
            this.liquidDexContract
          );
        } else if (exchange === "illiquidDex" && dexTradeSize > 0) {
          tx = await this.executeTrade(
            this.priceIndexService.getToken(sellToken, false),
            this.priceIndexService.getToken(buyToken, false),
            dexTradeSize,
            this.illiquidDexContract
          );
        } else if (exchange === "uniswap" && dexTradeSize > 0) {
          tx = await this.executeTrade(
            this.priceIndexService.getToken(sellToken, false),
            this.priceIndexService.getToken(buyToken, false),
            dexTradeSize,
            null
          );
        }
        await tx;
        console.log("tx", tx);
        batch.add(tx);
      }
    }
    // Execute the transactions in a single batch
    // const batch = new this.web3.BatchRequest();
    // for (let i = 0; i < this.transactions.length; i++) {
    //   batch.add(this.transactions[i]);
    // }
    console.log("Executing batch...");
    console.log("Transactions: ", this.transactions);
    console.log("Batch: ", batch);
    batch.execute();
  }

  async loadBlockchainData() {
    console.log("Initializing trade service...");
    if (typeof window.ethereum !== 'undefined') {
      this.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (typeof window.web3 !== 'undefined') {
      this.web3 = new Web3(window.web3.currentProvider);
    } else {
      console.log('No MetaMask or Web3 detected.');
      return;
    }

    const randomTradeAccount8 = this.web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY8);
    this.web3.eth.accounts.wallet.add(randomTradeAccount8);
    const randomTradeAccount9 = this.web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY9);
    this.web3.eth.accounts.wallet.add(randomTradeAccount9);

    const accounts = await this.web3.eth.getAccounts();
    this.account = accounts[0];

    this.liquidDexContract = new this.web3.eth.Contract(liquidDex.abi, liquidDex.networks[5777].address);
    this.illiquidDexContract = new this.web3.eth.Contract(illiquidDex.abi, illiquidDex.networks[5777].address);
    this.linkTokenContract = new this.web3.eth.Contract(linkToken.abi, linkToken.networks[5777].address);
    this.maticTokenContract = new this.web3.eth.Contract(maticToken.abi, maticToken.networks[5777].address);
    this.sushiTokenContract = new this.web3.eth.Contract(sushiToken.abi, sushiToken.networks[5777].address);
    this.usdcTokenContract = new this.web3.eth.Contract(usdcToken.abi, usdcToken.networks[5777].address);
    this.wbtcTokenContract = new this.web3.eth.Contract(wbtcToken.abi, wbtcToken.networks[5777].address);

    // executeRandomTrade(this.liquidDexContract, true);
    // console.log(this.liquidDexContract);

    // setInterval(() => {
    //   console.log("Executing random trade1...");
    //   executeRandomTrade(this.liquidDexContract, true);
    // }, Math.floor(Math.random() * 4000) + 1000); // random interval between 5 and 10 seconds
    // setInterval(() => {
    //   console.log("Executing random trade2...");
    //   executeRandomTrade(this.illiquidDexContract, false);
    // }, Math.floor(Math.random() * 50000) + 10000); // random interval between 20 and 100 seconds
  }
}