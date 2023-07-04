import { Component } from '@angular/core';
import { UniswapService } from '../uniswap.service';
import { DydxService } from '../dydx.service';
import { TradeService } from '../trade.service';
import { PriceIndexService } from '../price-index.service';


interface ExchangeData {
  exchangeName: string;
  pairs: PairData[];
}

interface PairData {
  pair: string;
  price: number;
}

@Component({
  selector: 'app-trade-prices',
  templateUrl: './trade-prices.component.html',
  styleUrls: ['./trade-prices.component.css']
})
export class TradePricesComponent {
  uniswapData: any;
  dydxData: any;
  myDexesData: any;
  public exchangesData: any;
  tokenAmount: number = 1;
  showTable: boolean = false;


  constructor(
    private uniswapService: UniswapService,
    private dydxService: DydxService,
    private tradeService: TradeService,
    private priceIndexService: PriceIndexService
  ) { }

  async ngOnInit() {
    this.tradeService.loadBlockchainData();
    this.uniswapData = this.uniswapService.getUniswapData();
    this.dydxData = this.dydxService.getPairs();
    this.myDexesData = await this.priceIndexService.getPrices();
    setTimeout(() => {
      this.parseData();
    }, 1000);
    // setInterval(async () => {
    //   const tempUniswapData = this.uniswapService.getUniswapData();
    //   // console.log(tempUniswapData);
    //   if (tempUniswapData.length !== 0) {
    //     this.uniswapData = tempUniswapData;
    //   }
    //   const tempDydxData = this.dydxService.getPairs();
    //   if (tempDydxData.length !== 0) {
    //     this.dydxData = tempDydxData;
    //   }
    //   this.myDexesData = await this.priceIndexService.getPrices();
    //   await new Promise(f => setTimeout(f, 1000));
    //   this.parseData();
    // }, 10000);

  }

  toggleTable() {
    this.showTable = !this.showTable;
  }

  async refreshPrices() {
    console.log("refreshing prices");
    const tempUniswapData = this.uniswapService.getUniswapData();
    // console.log(tempUniswapData);
    if (tempUniswapData.length !== 0) {
      this.uniswapData = tempUniswapData;
    }
    console.log(this.uniswapData, tempUniswapData);
    const tempDydxData = this.dydxService.getPairs();
    if (tempDydxData.length !== 0) {
      this.dydxData = tempDydxData;
    }
    this.myDexesData = await this.priceIndexService.getPrices();
    await new Promise(f => setTimeout(f, 1000));
    this.parseData();
    console.log("refreshed prices");
  }

  parseData = () => {
    this.exchangesData = [];

    // iterate over all uniswap pairs
    let uniswapData: ExchangeData = {
      exchangeName: "UNISWAP",
      pairs: []
    }
    for (let i = 0; i < this.uniswapData.length; i++) {
      if (this.uniswapData[i].token0.symbol === "WETH") {
        this.uniswapData[i].token0.symbol = "ETH";
        console.log("changed WETH to ETH");
        continue;
      }
      let pairData: PairData = {
        pair: this.uniswapData[i].token0.symbol + "/" + this.uniswapData[i].token1.symbol,
        price:
          this.uniswapData[i].token0Price > this.uniswapData[i].token1Price
            ?
            this.uniswapData[i].token0Price : this.uniswapData[i].token1Price
      };
      uniswapData.pairs.push(pairData);
      uniswapData.pairs.sort((a, b) => (a.pair > b.pair) ? 1 : -1);
    }
    this.exchangesData.push(uniswapData);

    // iterate over all dydx pairs
    let dydxData: ExchangeData = {
      exchangeName: "DyDx",
      pairs: []
    }
    for (let i = 0; i < this.dydxData.length; i++) {
      if (this.dydxData[i].baseAsset === "ETH") {
        continue;
      }
      if (this.dydxData[i].baseAsset === "BTC") {
        this.dydxData[i].baseAsset = "WBTC";
      }
      let pairData: PairData = {
        pair: this.dydxData[i].baseAsset + "/" + this.dydxData[i].quoteAsset,
        price: this.dydxData[i].indexPrice
      };
      dydxData.pairs.push(pairData);
      dydxData.pairs.sort((a, b) => (a.pair > b.pair) ? 1 : -1);
    }
    this.exchangesData.push(dydxData);

    // iterate over all myDex pairs
    let liquidDexData: ExchangeData = {
      exchangeName: "Fully Liquid DEX",
      pairs: []
    }
    for (let i = 0; i < this.myDexesData.length; i++) {
      if (this.myDexesData[i].tokenPair === "ETH/USD") {
        continue;
      }
      if (this.myDexesData[i].isLiquid === false) continue;
      let pairData: PairData = {
        pair: this.myDexesData[i].tokenPair,
        price: this.myDexesData[i].indexPrice
      }
      liquidDexData.pairs.push(pairData);
      liquidDexData.pairs.sort((a, b) => (a.pair > b.pair) ? 1 : -1);
    }
    this.exchangesData.push(liquidDexData);

    let illiquidDexData: ExchangeData = {
      exchangeName: "Non Liquid DEX",
      pairs: []
    }
    for (let i = 0; i < this.myDexesData.length; i++) {
      if (this.myDexesData[i].tokenPair === "ETH/USD") {
        continue;
      }
      if (this.myDexesData[i].isLiquid === true) continue;
      let pairData: PairData = {
        pair: this.myDexesData[i].tokenPair,
        price: this.myDexesData[i].indexPrice
      }
      illiquidDexData.pairs.push(pairData);
      illiquidDexData.pairs.sort((a, b) => (a.pair > b.pair) ? 1 : -1);
    }
    this.exchangesData.push(illiquidDexData);
    console.log(this.exchangesData);
  }
}
