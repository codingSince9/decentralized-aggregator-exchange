import { Injectable } from '@angular/core';
import { ChainId, Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType } from '@uniswap/sdk'
import { HttpClient } from '@angular/common/http';

export interface Market {
  token0: {
    id: string;
    name: string;
    symbol: string;
  };
  token1: {
    id: string;
    name: string;
    symbol: string;
  };
  reserve0: number;
  reserve1: number;
  reserveUSD: number;
  trackedReserveETH: number;
  token0Price: number;
  token1Price: number;
  volumeUSD: number;
}

@Injectable({
  providedIn: 'root'
})
export class UniswapService {
  private apiUrl = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
  markets: Market[] = [];
  ETH_PRICE: number = 0;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getUniswapData();
  }

  getUniswapData() {
    const query = `
    {
      eth_usdc: pair(id: "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc") {
        id
        token0 {
          id
          symbol
          name
        }
        token1 {
          id
          symbol
          name
        }
        reserve0
        reserve1
        reserveUSD
        trackedReserveETH
        token0Price
        token1Price
        volumeUSD
      }
      wbtc_usdc: pair(id: "0x004375dff511095cc5a197a54140a24efef3a416") {
        id
        token0 {
          id
          symbol
          name
        }
        token1 {
          id
          symbol
          name
        }
        reserve0
        reserve1
        reserveUSD
        trackedReserveETH
        token0Price
        token1Price
        volumeUSD
      }
      link_weth: pair(id: "0xa2107fa5b38d9bbd2c461d6edf11b11a50f6b974") {
        id
        token0 {
          id
          symbol
          name
        }
        token1 {
          id
          symbol
          name 
        }
        reserve0 
        reserve1 
        reserveUSD 
        trackedReserveETH 
        token0Price 
        token1Price 
        volumeUSD 
      }
      matic_weth: pair(id: "0x819f3450da6f110ba6ea52195b3beafa246062de") {
      id 
      token0 { 
        id 
        symbol 
        name 
      } 
      token1 { 
        id 
        symbol 
        name 
      } 
      reserve0 
      reserve1 
      reserveUSD  
      trackedReserveETH  
      token0Price  
      token1Price  
      volumeUSD  
      }	
      sushi_weth: pair(id:"0xce84867c3c02b05dc570d0135103d3fb9cc19433"){
      id	
      token0{
        id	
        symbol	
        name	
      }
      token1{
        id	
        symbol	
        name	
      }
      reserve0	
      reserve1	
      reserveUSD	
      trackedReserveETH	
      token0Price	
      token1Price	
      volumeUSD	
      }
    }
    `

    const correctMarket = (market: Market) => {
      if ((market.token1.symbol == 'WETH' || market.token0.symbol == 'USDC') &&
        !(market.token1.symbol == 'WETH' && market.token0.symbol == 'USDC')
      ) {
        market.token0Price = this.ETH_PRICE / market.token0Price;
        market.token1.symbol = 'USDC';
      } else if (market.token1.symbol == 'WETH' && market.token0.symbol == 'USDC') {
        const temp = market.token0;
        market.token0 = market.token1;
        market.token1 = temp;
      }
      return market;
    };

    const data = this.http.post(this.apiUrl, { query });
    this.markets = [];
    data.subscribe((res: any) => {
      const pairs = res.data;
      Object.keys(pairs).forEach((key) => {
        const value = pairs[key];
        if (key == 'eth_usdc') {
          this.ETH_PRICE = value.token0Price;
        } else if (key == 'wbtc_usdc') {
          value.reserve1 /= this.ETH_PRICE;
        }
        this.markets.push(correctMarket(value));
      });
    });

    return this.markets;
  }

  getTokenReserves(token0: string, token1: string) {
    let market = this.markets.find((m) => m.token0.symbol == token0 && m.token1.symbol == token1);
    if (market) {
      return {
        reserve0: Number(market.reserve0),
        reserve1: market.reserve1 * this.ETH_PRICE,
      };
    } else {
      market = this.markets.find((m) => m.token0.symbol == token1 && m.token1.symbol == token0) as Market;
      // swapping token0 and token1
      return {
        reserve0: market.reserve1 * this.ETH_PRICE,
        reserve1: Number(market.reserve0),
      };
    }
  }
}