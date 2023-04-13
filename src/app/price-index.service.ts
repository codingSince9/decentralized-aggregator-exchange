import { Injectable } from '@angular/core';
import Web3 from 'web3';

declare let require: any;
declare let window: any;

interface Price {
  indexPrice: number;
  tokenPair: string;
  isLiquid: boolean;
}

const liquidDex = require('../../build/contracts/FullyLiquidDecentralizedExchange.json');
const illiquidDex = require('../../build/contracts/NotSoLiquidDecentralizedExchange.json');
const linkToken = require('../../build/contracts/Link.json');
const maticToken = require('../../build/contracts/Matic.json');
const sushiToken = require('../../build/contracts/Sushi.json');
const usdcToken = require('../../build/contracts/Usdc.json');
const wbtcToken = require('../../build/contracts/Wbtc.json');

@Injectable({
  providedIn: 'root'
})
export class PriceIndexService {
  private web3: any;
  private liquidDexContract: any;
  private illiquidDexContract: any;
  private linkTokenContract: any;
  private maticTokenContract: any;
  private sushiTokenContract: any;
  private usdcTokenContract: any;
  private wbtcTokenContract: any;
  prices: Price[] = [];

  constructor() {
    if (typeof window.ethereum !== 'undefined') {
      this.web3 = new Web3(window.ethereum);
      window.ethereum.enable();
    } else if (typeof window.web3 !== 'undefined') {
      this.web3 = new Web3(window.web3.currentProvider);
    } else {
      console.log('No MetaMask or Web3 detected.');
      return;
    }
    this.liquidDexContract = new this.web3.eth.Contract(liquidDex.abi, liquidDex.networks[5777].address);
    this.illiquidDexContract = new this.web3.eth.Contract(illiquidDex.abi, illiquidDex.networks[5777].address);
    this.linkTokenContract = new this.web3.eth.Contract(linkToken.abi, linkToken.networks[5777].address);
    this.maticTokenContract = new this.web3.eth.Contract(maticToken.abi, maticToken.networks[5777].address);
    this.sushiTokenContract = new this.web3.eth.Contract(sushiToken.abi, sushiToken.networks[5777].address);
    this.usdcTokenContract = new this.web3.eth.Contract(usdcToken.abi, usdcToken.networks[5777].address);
    this.wbtcTokenContract = new this.web3.eth.Contract(wbtcToken.abi, wbtcToken.networks[5777].address);
  }

  getToken = (token: string, addressRequested: boolean) => {
    let contract: any;
    switch (token) {
      case "LINK":
        contract = this.linkTokenContract;
        break;
      case "MATIC":
        contract = this.maticTokenContract;
        break;
      case "SUSHI":
        contract = this.sushiTokenContract;
        break;
      case "WBTC":
        contract = this.wbtcTokenContract;
        break;
      case "ETH":
        contract = this.liquidDexContract;
        break;
      case "USDC":
        contract = this.usdcTokenContract;
        break;
    }
    if (addressRequested) {
      return contract.options.address;
    } else {
      return contract;
    }
  }

  getTokenPrice = async (tokenToBuy: string, tokenToSell: string, amount: string) => {
    let price = await this.liquidDexContract.methods.getAmountOut(
      this.getToken(tokenToSell, true),
      this.getToken(tokenToBuy, true),
      this.web3.utils.toWei(amount, "ether")).call();
    price = this.web3.utils.fromWei(price, "ether");
    // trim decimals to 5
    price = price.substring(0, price.indexOf(".") + 6);
    return price;
  }

  getUserBalance = async (token: string) => {
    const accounts = await this.web3.eth.requestAccounts();
    const contract = this.getToken(token, false);
    let balance = await contract.methods.balanceOf(accounts[0]).call();
    balance = this.web3.utils.fromWei(balance, "ether");
    // trim decimals to 5
    // balance = balance.substring(0, balance.indexOf(".") + 6);
    return balance;
  }

  getPrices = async () => {
    this.prices = [];
    let linkPrice = await this.liquidDexContract.methods.getAmountOut(
      this.linkTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    let ethPrice = await this.liquidDexContract.methods.getAmountOut(
      this.liquidDexContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    let maticPrice = await this.liquidDexContract.methods.getAmountOut(
      this.maticTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    let sushiPrice = await this.liquidDexContract.methods.getAmountOut(
      this.sushiTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    let wbtcPrice = await this.liquidDexContract.methods.getAmountOut(
      this.wbtcTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    let item = {
      indexPrice: this.web3.utils.fromWei(ethPrice, "ether"),
      tokenPair: "ETH/USD",
      isLiquid: true
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(linkPrice, "ether"),
      tokenPair: "LINK/USD",
      isLiquid: true
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(maticPrice, "ether"),
      tokenPair: "MATIC/USD",
      isLiquid: true
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(sushiPrice, "ether"),
      tokenPair: "SUSHI/USD",
      isLiquid: true
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(wbtcPrice, "ether"),
      tokenPair: "WBTC/USD",
      isLiquid: true
    };
    this.prices.push(item);


    ethPrice = await this.illiquidDexContract.methods.getAmountOut(
      this.illiquidDexContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    linkPrice = await this.illiquidDexContract.methods.getAmountOut(
      this.linkTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    maticPrice = await this.illiquidDexContract.methods.getAmountOut(
      this.maticTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    sushiPrice = await this.illiquidDexContract.methods.getAmountOut(
      this.sushiTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    wbtcPrice = await this.illiquidDexContract.methods.getAmountOut(
      this.wbtcTokenContract.options.address,
      this.usdcTokenContract.options.address,
      this.web3.utils.toWei("1", "ether")).call();
    item = {
      indexPrice: this.web3.utils.fromWei(ethPrice, "ether"),
      tokenPair: "ETH/USD",
      isLiquid: false
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(linkPrice, "ether"),
      tokenPair: "LINK/USD",
      isLiquid: false
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(maticPrice, "ether"),
      tokenPair: "MATIC/USD",
      isLiquid: false
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(sushiPrice, "ether"),
      tokenPair: "SUSHI/USD",
      isLiquid: false
    };
    this.prices.push(item);
    item = {
      indexPrice: this.web3.utils.fromWei(wbtcPrice, "ether"),
      tokenPair: "WBTC/USD",
      isLiquid: false
    };
    this.prices.push(item);
    return this.prices;
  }
}
