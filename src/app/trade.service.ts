import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { DydxService } from './dydx.service';
import { PriceIndexService } from './price-index.service';
import { UniswapService } from './uniswap.service';
import { sqrt, typeOf } from 'mathjs';


declare let require: any;
declare let window: any;

interface Dex {
  name: string;
  reserve0: number;
  reserve1: number;
}

export interface TradeSize {
  liquidDex: number,
  illiquidDex: number,
  uniswap: number
}

const dexAggregator = require('../../build/contracts/DexAggregator.json');
const liquidDex = require('../../build/contracts/FullyLiquidDecentralizedExchange.json');
const illiquidDex = require('../../build/contracts/NotSoLiquidDecentralizedExchange.json');
const linkToken = require('../../build/contracts/Link.json');
const maticToken = require('../../build/contracts/Matic.json');
const sushiToken = require('../../build/contracts/Sushi.json');
const usdcToken = require('../../build/contracts/Usdc.json');
const wbtcToken = require('../../build/contracts/Wbtc.json');

// import variable from .env file
const PUBLIC_KEY_8 = "0xD0D76B4C734CdEf0d66cfe3595A82538cfE6550e";
const PUBLIC_KEY_9 = "0x5c8ce49DB19b2e7cd9FfD9853Cb91ba8Cf93e83f";
const PRIVATE_KEY_8 = "76db17660b790ecc22ef00bbf93ce9c60989a7a9488aa6f6eb1aa948bb2513b3";
const PRIVATE_KEY_9 = "2979ee37a8723c4b0870240db55f154b4f43db048bace7da227206add2d7fd0d";
const BUY_DIRECTION = "BUY";
const SELL_DIRECTION = "SELL";
export const USDC_TOKEN_SYMBOL = "USDC";
const LIQUIDDEX_NAME = "liquidDex";
const ILLIQUIDDEX_NAME = "illiquidDex";
const UNISWAP_NAME = "uniswap";

export interface SwapPercentages {
  name: string;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})

export class TradeService {

  private account: any;
  private web3: any;
  private dexAggregatorContract: any;
  private liquidDexContract: any;
  private illiquidDexContract: any;
  private linkTokenContract: any;
  private maticTokenContract: any;
  private sushiTokenContract: any;
  private usdcTokenContract: any;
  private wbtcTokenContract: any;
  public swapPercentages: object = {};
  private executingTrade: boolean = false;

  constructor(
    private uniswapService: UniswapService,
    private dydxService: DydxService,
    private priceIndexService: PriceIndexService
  ) { }

  getRandomTradeSize(probability: number) {
    let size: number;
    if (probability < 0.90) {
      size = Math.random() * 990 + 10;
    } else if (probability < 0.98) {
      size = Math.random() * 4000 + 1000;
    } else if (probability < 0.999) {
      size = Math.random() * 5000 + 5000;
    } else {
      size = Math.random() * 990000 + 10000;
    }
    // trim size to 5 decimal places
    size = Math.floor(size * 100000) / 100000;
    return this.web3.utils.toWei(size.toString(), 'ether');
  }

  async executeRandomTrade(
    tradeAccountPublicKey: string,
    tradeAccountPrivateKey: string,
    dexContract: any,
    tradeSize: string,
    buyTokenSymbol: string,
    direction: string
  ) {
    // let nonce = await this.web3.eth.getTransactionCount(tradeAccountPublicKey);
    let transactionObject = {
      from: tradeAccountPublicKey,
      to: "to",
      // nonce: nonce,
      gasPrice: 20000000000,
      gas: 6721975,
      value: 0,
      data: "transferData"
    };
    tradeSize = this.web3.utils.fromWei(tradeSize, 'ether');
    if (direction == BUY_DIRECTION) {
      // meaning we are selling usdc tokens for another token
      transactionObject["to"] = this.usdcTokenContract.options.address;
      transactionObject["data"] = this.usdcTokenContract.methods.transfer(this.dexAggregatorContract.options.address, tradeSize).encodeABI();
      console.log("TRANSFERING USDC TOKENS");
    } else {
      const buyTokenContract = this.priceIndexService.getToken(buyTokenSymbol, false);
      transactionObject["to"] = buyTokenContract.options.address;
      transactionObject["data"] = buyTokenContract.methods.transfer(this.dexAggregatorContract.options.address, tradeSize).encodeABI();
      console.log("TRANSFERING", buyTokenSymbol, "TOKENS");
    }
    const signedTransaction = await this.web3.eth.accounts.signTransaction(transactionObject, tradeAccountPrivateKey);
    const transactionReceipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log("Pre-Transaction:", transactionReceipt);
    setTimeout(() => {
    }, 5000);

    const buyTokenAddress = this.priceIndexService.getToken(buyTokenSymbol, true);
    // nonce = await this.web3.eth.getTransactionCount(tradeAccountPublicKey);
    const isLiquidArray = dexContract === this.liquidDexContract ? [true] : [false];
    const tokenSoldArray = direction === BUY_DIRECTION ? [buyTokenAddress] : [this.usdcTokenContract.options.address];
    const tokenBoughtArray = direction === BUY_DIRECTION ? [this.usdcTokenContract.options.address] : [buyTokenAddress];
    const amountSoldArray = [tradeSize];
    // console.log("nonce", nonce);

    const transactionObject2 = {
      from: tradeAccountPublicKey,
      to: this.dexAggregatorContract.options.address,
      // nonce: nonce,
      gasPrice: 20000000000,
      gas: 6721975,
      value: 0,
      data: this.dexAggregatorContract.methods.executeSwaps(
        isLiquidArray,
        tokenSoldArray,
        tokenBoughtArray,
        amountSoldArray
      ).encodeABI()
    };
    const signedTransaction2 = await this.web3.eth.accounts.signTransaction(transactionObject2, tradeAccountPrivateKey);
    const transactionReceipt2 = await this.web3.eth.sendSignedTransaction(signedTransaction2.rawTransaction);
    console.log("Final Transaction:", transactionReceipt2);
    setTimeout(() => {
    }, 5000);
  }

  async calculateRandomTrade(isLiquid: boolean) {
    const dexContract = isLiquid ? this.liquidDexContract : this.illiquidDexContract;
    const tradeAccountPublicKey = isLiquid ? PUBLIC_KEY_8 : PUBLIC_KEY_9;
    const tradeAccountPrivateKey = isLiquid ? PRIVATE_KEY_8 : PRIVATE_KEY_9;
    const buyToken = [
      // isLiquid ? this.liquidDexContract : this.illiquidDexContract,
      this.linkTokenContract,
      this.maticTokenContract,
      this.sushiTokenContract,
      this.wbtcTokenContract
    ][Math.floor(Math.random() * 4)].options.address;
    let tradeSize = this.getRandomTradeSize(Math.random());
    let buyTokenSymbol = "";
    if (buyToken === this.linkTokenContract.options.address) {
      buyTokenSymbol = "LINK";
      console.log("Token pair name: LINK");
    } else if (buyToken === this.maticTokenContract.options.address) {
      buyTokenSymbol = "MATIC";
      console.log("Token pair name: MATIC");
    } else if (buyToken === this.sushiTokenContract.options.address) {
      buyTokenSymbol = "SUSHI";
      console.log("Token pair name: SUSHI");
    } else {
      buyTokenSymbol = "WBTC";
      tradeSize = String(Number(tradeSize) / 1000);
      console.log("Token pair name: WBTC");
    }

    console.log("Trade size: " + this.web3.utils.fromWei(tradeSize, 'ether'));
    console.log("Token pair: " + buyToken);

    // get price of token pair
    // console.log(this.uniswapService.markets);
    // console.log(this.uniswapService.markets.find((m) => m.token0.symbol == USDC_TOKEN_SYMBOL && m.token1.symbol == buyTokenSymbol) as Market);
    // console.log(this.uniswapService.markets.find((m) => m.token0.symbol == buyTokenSymbol && m.token1.symbol == USDC_TOKEN_SYMBOL) as Market);
    // console.log(buyTokenSymbol.length);
    let swap = false;
    const tokenPairPrice = await this.priceIndexService.getTokenPrice(dexContract, USDC_TOKEN_SYMBOL, buyTokenSymbol, "1");
    let uniswapMarket = this.uniswapService.getTokenReserves(USDC_TOKEN_SYMBOL, buyTokenSymbol);
    const uniswapPairPrice = buyTokenSymbol == "WBTC" ? uniswapMarket.token1Price : uniswapMarket.token0Price as number;
    // check if the dex price is within 5% of the uniswap price
    const isUniswapPriceHigher = uniswapPairPrice > tokenPairPrice * 1.05;
    const isUniswapPriceLower = uniswapPairPrice < tokenPairPrice * 0.95;
    const buyTokenBalance = await this.getTokenReserves(this.liquidDexContract, buyTokenSymbol, USDC_TOKEN_SYMBOL);
    const sellTokenBalance = await this.getTokenReserves(this.liquidDexContract, USDC_TOKEN_SYMBOL, buyTokenSymbol);
    const constantProduct = buyTokenBalance * sellTokenBalance;

    if (isUniswapPriceHigher || isUniswapPriceLower) {
      // calculate how much to buy to bring the price equal to uniswap price
      // console.log("HIGHER THAN 5%");
      // console.log("Trade size: " + tradeSize);
      // console.log("Buy token balance: " + buyTokenBalance);
      // console.log("Sell token balance: " + sellTokenBalance);
      // console.log("Uniswap price: " + uniswapPairPrice);
      // console.log("Calculated trade size: " + ((sellTokenBalance / uniswapPairPrice) - buyTokenBalance));

      const x: any = constantProduct / uniswapPairPrice;
      const newReserve0 = uniswapPairPrice * sqrt(x);
      const newReserve1 = sqrt(x);
      // console.log("New reserve0: " + newReserve0);
      // console.log("New reserve1: " + newReserve1);

      const data = dexContract.methods.executeArbitrage(
        this.usdcTokenContract.options.address,
        buyToken,
        this.web3.utils.toWei(newReserve0.toString(), 'ether'),
        this.web3.utils.toWei(newReserve1.toString(), 'ether')
      ).encodeABI();
      const transactionObject = {
        from: tradeAccountPublicKey,
        to: dexContract.options.address,
        // nonce: nonce,
        gasPrice: 20000000000,
        gas: 6721975,
        value: 0,
        data: data
      };
      const signedTransaction = await this.web3.eth.accounts.signTransaction(transactionObject, tradeAccountPrivateKey);
      const transactionReceipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
      console.log("Arbitrage Transaction:", transactionReceipt);
      setTimeout(() => {
      }, 5000);
    } else {
      // Randomly decide whether to buy or sell
      const direction = Math.random() >= 0.5 ? BUY_DIRECTION : SELL_DIRECTION;
      tradeSize = this.web3.utils.toWei(tradeSize.toString(), 'ether');
      this.executeRandomTrade(tradeAccountPublicKey, tradeAccountPrivateKey, dexContract, tradeSize, buyTokenSymbol, direction);
    }
  }

  getAmountOut(reserve0: number, reserve1: number, size: number) {
    const k = reserve0 * reserve1;
    const newReserve0 = Number(reserve0) + Number(size);
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
        const { maximumOutcomeDex, maximumOutcome } = this.getMostProfitableDex(dexes, STEP);
        tradeSizes[maximumOutcomeDex] += STEP;
        for (let j = 0; j < dexes.length; j++) {
          if (dexes[j].name === maximumOutcomeDex) {
            dexes[j].reserve0 = Number(dexes[j].reserve0) + Number(STEP);
            dexes[j].reserve1 -= maximumOutcome;
            tradeOutcomeAmount += Number(maximumOutcome);
          }
        }
        leftover = i;
      }
    }
    leftover = tradeSize - leftover;
    const { maximumOutcomeDex, maximumOutcome } = this.getMostProfitableDex(dexes, leftover);
    tradeSizes[maximumOutcomeDex] += leftover;
    tradeOutcomeAmount += Number(maximumOutcome);
    if (calculateAmount) {
      return tradeOutcomeAmount;
    } else {
      return tradeSizes as TradeSize;
    }
  }

  async getTokenReserves(contract: any, token1: string, token2: string) {
    const liquidity = await contract.methods.reserves(
      this.priceIndexService.getToken(token2, true),
      this.priceIndexService.getToken(token1, true)
    ).call();
    return this.web3.utils.fromWei(liquidity, 'ether');
  }

  async findBestLiquidity(buyToken: string, sellToken: string, tradeSize: number, calculateAmount: boolean) {
    let liquidDexPairLiquidity: Dex = {
      name: LIQUIDDEX_NAME,
      reserve0: await this.getTokenReserves(this.liquidDexContract, buyToken, sellToken),
      reserve1: await this.getTokenReserves(this.liquidDexContract, sellToken, buyToken)
    }
    let illiquidDexPairLiquidity: Dex = {
      name: ILLIQUIDDEX_NAME,
      reserve0: await this.getTokenReserves(this.illiquidDexContract, buyToken, sellToken),
      reserve1: await this.getTokenReserves(this.illiquidDexContract, sellToken, buyToken)
    }
    let uniswapTokenReserves = this.uniswapService.getTokenReserves(sellToken, buyToken);
    let uniswapPairLiquidity: Dex = {
      name: UNISWAP_NAME,
      reserve0: uniswapTokenReserves.reserve0,
      reserve1: uniswapTokenReserves.reserve1
    };
    const dexes: Dex[] = [liquidDexPairLiquidity, illiquidDexPairLiquidity, uniswapPairLiquidity];
    const percentages = this.calculateTradeSizeForEachDex(dexes, tradeSize, calculateAmount);
    if (typeof percentages === "number") {
      this.swapPercentages = this.calculateTradeSizeForEachDex(dexes, tradeSize, false) as TradeSize;
    } else {
      this.swapPercentages = percentages;
    }
    // console.log("Percentages: ", this.swapPercentages);
    return percentages;
  }

  async executeMockedTransaction(token: any, receivingAddress: string, amount: number) {
    const nonce = await this.web3.eth.getTransactionCount(PUBLIC_KEY_8);
    const transferData = token.methods.transfer(receivingAddress, amount).encodeABI();
    const transactionObject = {
      from: PUBLIC_KEY_8,
      to: token.options.address,
      // nonce: nonce,
      gasPrice: 20000000000,
      gas: 67210,
      value: 0,
      data: transferData
    };
    const signedTransaction = await this.web3.eth.accounts.signTransaction(transactionObject, PRIVATE_KEY_8);
    const transactionReceipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log("Executed mocked transaction: ", transactionReceipt);
  }

  async tokenToDollarConversion(liquidityObject: TradeSize, sellToken: string, multipleTrades: boolean) {
    let isLiquidArray: boolean[] = [];
    let tokenSoldArray: string[] = [];
    let tokenBoughtArray: string[] = [];
    let amountSoldArray: number[] = [];
    let amountSold = 0;
    for (let [exchange, dexTradeSize] of Object.entries(liquidityObject)) {
      if (exchange === LIQUIDDEX_NAME && dexTradeSize > 0) {
        amountSold = this.web3.utils.toWei(dexTradeSize.toString(), 'ether');
        isLiquidArray.push(true);
        amountSoldArray.push(amountSold);
        tokenSoldArray.push(this.priceIndexService.getToken(sellToken, true));
        tokenBoughtArray.push(this.usdcTokenContract.options.address);
      } else if (exchange === ILLIQUIDDEX_NAME && dexTradeSize > 0) {
        amountSold = this.web3.utils.toWei(dexTradeSize.toString(), 'ether');
        isLiquidArray.push(false);
        amountSoldArray.push(amountSold);
        tokenSoldArray.push(this.priceIndexService.getToken(sellToken, true));
        tokenBoughtArray.push(this.usdcTokenContract.options.address);
      } else if (exchange === UNISWAP_NAME && dexTradeSize > 0 && !multipleTrades) {
        let tokenToDollarOutput = await this.findBestLiquidity(USDC_TOKEN_SYMBOL, sellToken, dexTradeSize, true) as number;
        tokenToDollarOutput = this.web3.utils.toWei(tokenToDollarOutput.toString(), 'ether');
        await this.executeMockedTransaction(this.usdcTokenContract, this.account, tokenToDollarOutput);
        // NASTAVAK:)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
      } else if (exchange === UNISWAP_NAME && dexTradeSize > 0 && multipleTrades) {
        let dollarToTokenOutput = await this.findBestLiquidity(USDC_TOKEN_SYMBOL, sellToken, dexTradeSize, true) as number;
        dollarToTokenOutput = this.web3.utils.toWei(dollarToTokenOutput.toString(), 'ether');
        await this.executeMockedTransaction(this.usdcTokenContract, this.dexAggregatorContract.options.address, dollarToTokenOutput);
      }
    }
    return [isLiquidArray, tokenSoldArray, tokenBoughtArray, amountSoldArray];
  }

  async dollarToTokenConversion(liquidityObject: TradeSize, buyToken: string) {
    let isLiquidArray: boolean[] = [];
    let tokenSoldArray: string[] = [];
    let tokenBoughtArray: string[] = [];
    let amountSoldArray: number[] = [];
    let amountSold = 0;
    const buyTokenContract = this.priceIndexService.getToken(buyToken, false);
    for (let [exchange, dexTradeSize] of Object.entries(liquidityObject)) {
      if (exchange === LIQUIDDEX_NAME && dexTradeSize > 0) {
        amountSold = this.web3.utils.toWei(dexTradeSize.toString(), 'ether');
        isLiquidArray.push(true);
        amountSoldArray.push(amountSold);
        tokenSoldArray.push(this.usdcTokenContract.options.address);
        tokenBoughtArray.push(buyTokenContract.options.address);
      } else if (exchange === ILLIQUIDDEX_NAME && dexTradeSize > 0) {
        amountSold = this.web3.utils.toWei(dexTradeSize.toString(), 'ether');
        isLiquidArray.push(false);
        amountSoldArray.push(amountSold);
        tokenSoldArray.push(this.usdcTokenContract.options.address);
        tokenBoughtArray.push(buyTokenContract.options.address);
      } else if (exchange === UNISWAP_NAME && dexTradeSize > 0) {
        let tokenToDollarOutput = await this.findBestLiquidity(buyToken, USDC_TOKEN_SYMBOL, dexTradeSize, true) as number;
        tokenToDollarOutput = this.web3.utils.toWei(tokenToDollarOutput.toString(), 'ether');
        await this.executeMockedTransaction(buyTokenContract, this.account, tokenToDollarOutput);
      }
    }
    return [isLiquidArray, tokenSoldArray, tokenBoughtArray, amountSoldArray];
  }

  async tokenSwap(buyToken: string, sellToken: string, tradeSize: number) {
    this.executingTrade = true;
    // get user balance of sell token
    let userBalance = await this.priceIndexService.getToken(sellToken, false).methods.balanceOf(this.account).call();
    userBalance = this.web3.utils.fromWei(userBalance, "ether");
    if (Number(userBalance) < tradeSize) {
      console.log("User balance is too low.");
      return false;
    }

    const userTradeSize = this.web3.utils.toWei(tradeSize.toString(), "ether");
    const sellTokenContract = this.priceIndexService.getToken(sellToken, false);
    try {
      await sellTokenContract.methods.transfer(this.dexAggregatorContract.options.address, userTradeSize).send({
        from: this.account
      });
    } catch (error) {
      console.log("Error approving token transfer: ", error);
      return false;
    }
    if (buyToken !== USDC_TOKEN_SYMBOL && sellToken !== USDC_TOKEN_SYMBOL) {
      const liquidityPath = await this.findBestLiquidity(USDC_TOKEN_SYMBOL, sellToken, tradeSize, false) as TradeSize;
      const [isLiquidArray1, tokenSoldArray1, tokenBoughtArray1, amountSoldArray1] = await this.tokenToDollarConversion(liquidityPath, sellToken, true);
      const tokenToDollarOutput = await this.findBestLiquidity(USDC_TOKEN_SYMBOL, sellToken, tradeSize, true) as number;
      const secondLiquidityPath = await this.findBestLiquidity(buyToken, USDC_TOKEN_SYMBOL, tokenToDollarOutput, false) as TradeSize;

      const [isLiquidArray2, tokenSoldArray2, tokenBoughtArray2, amountSoldArray2] = await this.dollarToTokenConversion(secondLiquidityPath, buyToken);
      const isLiquidArray = [...isLiquidArray1, ...isLiquidArray2];
      const tokenSoldArray = [...tokenSoldArray1, ...tokenSoldArray2];
      const tokenBoughtArray = [...tokenBoughtArray1, ...tokenBoughtArray2];
      const amountSoldArray = [...amountSoldArray1, ...amountSoldArray2];

      try {
        await this.dexAggregatorContract.methods.executeSwaps(
          isLiquidArray,
          tokenSoldArray,
          tokenBoughtArray,
          amountSoldArray
        ).send({ from: this.account }).on('transactionHash', function (hash: any) {
          console.log("Transaction hash: ", hash);
        });
      } catch (error) {
        console.log("Error executing swaps: ", error);
        return false;
      }
    } else if (buyToken === USDC_TOKEN_SYMBOL) {
      const liquidityPath = await this.findBestLiquidity(USDC_TOKEN_SYMBOL, sellToken, tradeSize, false) as TradeSize;
      let [isLiquidArray, tokenSoldArray, tokenBoughtArray, amountSoldArray] = await this.tokenToDollarConversion(liquidityPath, sellToken, false);

      try {
        await this.dexAggregatorContract.methods.executeSwaps(
          isLiquidArray,
          tokenSoldArray,
          tokenBoughtArray,
          amountSoldArray
        ).send({ from: this.account }).on('transactionHash', function (hash: any) {
          console.log("Transaction hash: ", hash);
        });
      } catch (error) {
        console.log("Error executing swaps: ", error);
        return false;
      }
    } else if (sellToken === USDC_TOKEN_SYMBOL) {
      const liquidityPath = await this.findBestLiquidity(buyToken, USDC_TOKEN_SYMBOL, tradeSize, false) as TradeSize;
      let [isLiquidArray, tokenSoldArray, tokenBoughtArray, amountSoldArray] = await this.dollarToTokenConversion(liquidityPath, buyToken);

      try {
        await this.dexAggregatorContract.methods.executeSwaps(
          isLiquidArray,
          tokenSoldArray,
          tokenBoughtArray,
          amountSoldArray
        ).send({ from: this.account }).on('transactionHash', function (hash: any) {
          console.log("Transaction hash: ", hash);
        });
      } catch (error) {
        console.log("Error executing swaps: ", error);
        return false;
      }
    }
    this.executingTrade = false;
    return true;
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

    const randomTradeAccount8 = this.web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY_8);
    this.web3.eth.accounts.wallet.add(randomTradeAccount8);
    const randomTradeAccount9 = this.web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY_9);
    this.web3.eth.accounts.wallet.add(randomTradeAccount9);

    const accounts = await this.web3.eth.getAccounts();
    this.account = accounts[0];

    this.dexAggregatorContract = new this.web3.eth.Contract(dexAggregator.abi, dexAggregator.networks[5777].address);
    this.liquidDexContract = new this.web3.eth.Contract(liquidDex.abi, liquidDex.networks[5777].address);
    this.illiquidDexContract = new this.web3.eth.Contract(illiquidDex.abi, illiquidDex.networks[5777].address);
    this.linkTokenContract = new this.web3.eth.Contract(linkToken.abi, linkToken.networks[5777].address);
    this.maticTokenContract = new this.web3.eth.Contract(maticToken.abi, maticToken.networks[5777].address);
    this.sushiTokenContract = new this.web3.eth.Contract(sushiToken.abi, sushiToken.networks[5777].address);
    this.usdcTokenContract = new this.web3.eth.Contract(usdcToken.abi, usdcToken.networks[5777].address);
    this.wbtcTokenContract = new this.web3.eth.Contract(wbtcToken.abi, wbtcToken.networks[5777].address);

    // this.calculateRandomTrade(this.liquidDexContract, true);
    // console.log(this.liquidDexContract);

    setInterval(async () => {
      if (!this.executingTrade) {
        const isLiquid = Math.random() >= 0.5;
        console.log("Executing random trade...");
        await this.calculateRandomTrade(isLiquid);
      }
    }, Math.floor(Math.random() * 10000) + 5000); // random interval between 1 and 5 seconds
    // setInterval(() => {
    // }, Math.floor(Math.random() * 5000) + 1000); // random interval between 10 and 60 seconds
  }
}