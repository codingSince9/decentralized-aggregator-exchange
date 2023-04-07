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
      gas: 6721975,
      value: 0,
      data: "transferData"
    };

    await this.usdcTokenContract.methods.approve(dexContract.options.address, tradeSize).send({ from: tradeAccountPublicKey, gas: 6721975 });
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
    return reserve1 - newReserve1;
  }

  getMostProfitableDex(dexes: Dex[], tradeSize: number) {
    let maximumOutcome = 0;
    let maximumOutcomeDex = "";
    for (let i = 0; i < dexes.length; i++) {
      let amountOut = this.getAmountOut(dexes[i].reserve0, dexes[i].reserve1, tradeSize);
      if (amountOut > maximumOutcome) {
        maximumOutcome = amountOut;
        maximumOutcomeDex = dexes[i].name;
      }
    }
    return maximumOutcomeDex;
  }

  async calculateTradeSizeForEachDex(dexes: Dex[], tradeSize: number) {
    let tradeSizes: any = {
      liquidDex: 0,
      illiquidDex: 0,
      uniswap: 0
    }
    for (let i = 0; i < tradeSize; i += 10) {
      const maximumOutcomeDex = this.getMostProfitableDex(dexes, 10);
      tradeSizes[maximumOutcomeDex] += 10;
    }
    const leftover = tradeSize % 10;
    const maximumOutcomeDex = this.getMostProfitableDex(dexes, leftover);
    tradeSizes[maximumOutcomeDex] += leftover;

    return tradeSizes;
  }

  async getPoolLiquidity(contract: any, token1: string, token2: string) {
    return await contract.methods.reserves(
      this.priceIndexService.getToken(token2, true),
      this.priceIndexService.getToken(token1, true),
      this.web3.utils.toWei("1", "ether")).call();
  }

  async findBestLiquidity(buyToken: string, sellToken: string, tradeSize: number) {
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
    let uniswapMarket = this.uniswapService.markets.find((m) => m.token0.symbol == buyToken && m.token1.symbol == sellToken);
    if (!uniswapMarket) {
      uniswapMarket = this.uniswapService.markets.find((m) => m.token0.symbol == sellToken && m.token1.symbol == buyToken);
      swap = true;
    }
    let uniswapPairLiquidity: Dex = {
      name: "uniswap",
      reserve0: swap ? uniswapMarket!.reserve1 : uniswapMarket!.reserve0,
      reserve1: swap ? uniswapMarket!.reserve0 : uniswapMarket!.reserve1
    };
    if (swap) {
      uniswapPairLiquidity.reserve0 *= this.uniswapService.ETH_PRICE;
    } else {
      uniswapPairLiquidity.reserve1 *= this.uniswapService.ETH_PRICE;
    }
    const dexes: Dex[] = [liquidDexPairLiquidity, illiquidDexPairLiquidity, uniswapPairLiquidity];
    const percentages = this.calculateTradeSizeForEachDex(dexes, tradeSize);
    return percentages;
  }

  async executeTrade(direction: boolean, buyToken: string, sellToken: string, tradeSize: number) {
  }

  async tokenSwap(direction: boolean, buyToken: string, sellToken: string, tradeSize: number) {
    if (buyToken !== "USDC" && sellToken !== "USDC") {
      const liquidityObject = this.findBestLiquidity("USDC", sellToken, tradeSize);
      const liquidityObject2 = this.findBestLiquidity(buyToken, "USDC", tradeSize);
      for (let [exchange, tradeSize] of Object.entries(liquidityObject)) {
        if (exchange === "liquidDex") {
          await this.executeTrade(direction, "USDC", sellToken, tradeSize);
        } else if (exchange === "illiquidDex") {
          await this.executeTrade(direction, "USDC", sellToken, tradeSize);
        } else if (exchange === "uniswap") {
          await this.executeTrade(direction, "USDC", sellToken, tradeSize);
        }
      }
      for (let [exchange, tradeSize] of Object.entries(liquidityObject2)) {
        if (exchange === "liquidDex") {
          await this.executeTrade(direction, buyToken, "USDC", tradeSize);
        } else if (exchange === "illiquidDex") {
          await this.executeTrade(direction, buyToken, "USDC", tradeSize);
        } else if (exchange === "uniswap") {
          await this.executeTrade(direction, buyToken, "USDC", tradeSize);
        }
      }
      // OVDJE NASTAVITI
    }
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