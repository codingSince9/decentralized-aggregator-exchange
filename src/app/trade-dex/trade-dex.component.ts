import { Component } from '@angular/core';
import { PriceIndexService } from '../price-index.service';

@Component({
  selector: 'app-trade-dex',
  templateUrl: './trade-dex.component.html',
  styleUrls: ['./trade-dex.component.css'],
})

export class TradeDexComponent {
  constructor(
    private priceIndexService: PriceIndexService
  ) { }


  tokenAmountToSpend: number = 0;
  tokenAmountToReceive: number = 0;
  spendTokenBalance: number = 0;
  receiveTokenBalance: number = 0;
  showDivSell: boolean = false;
  showDivBuy: boolean = false;
  tokens: any[] = [
    { name: 'Bitcoin', ticker: 'WBTC', image: '/assets/images/bitcoin.png' },
    // { name: 'Ethereum', ticker: 'ETH', image: '/assets/images/ethereum.png' },
    { name: 'Matic', ticker: 'MATIC', image: '/assets/images/matic.png' },
    { name: 'USD Coin', ticker: 'USDC', image: '/assets/images/usdc.png' },
    { name: 'Chainlink', ticker: 'LINK', image: '/assets/images/chainlink.png' },
    { name: 'Sushi Swap', ticker: 'SUSHI', image: '/assets/images/sushiswap.png' },
  ];
  selectedTokenSell: any = this.tokens[0];
  selectedTokenBuy: any = this.tokens[3];
  tokensSell: any[] = this.tokens.filter((token) => token.ticker !== this.selectedTokenBuy.ticker);
  tokensBuy: any[] = this.tokens.filter((token) => token.ticker !== this.selectedTokenSell.ticker);

  ngOnInit(): void {
    this.getBalances();
  }

  selectTokenSell(token: any) {
    this.selectedTokenSell = token;
    this.showDivSell = false;
    this.updateTokensToShow();
    this.calculateTokenPrice(this.tokenAmountToSpend);
  }
  selectTokenBuy(token: any) {
    this.selectedTokenBuy = token;
    this.showDivBuy = false;
    this.updateTokensToShow();
    this.calculateTokenPrice(this.tokenAmountToSpend);
  }

  swapBuyAndSellTokens() {
    let temp = this.selectedTokenSell;
    this.selectedTokenSell = this.selectedTokenBuy;
    this.selectedTokenBuy = temp;
    this.updateTokensToShow();
    this.calculateTokenPrice(this.tokenAmountToSpend);
  }

  updateTokensToShow() {
    this.tokensSell = this.tokens.filter((token) => token.ticker !== this.selectedTokenBuy.ticker);
    this.tokensBuy = this.tokens.filter((token) => token.ticker !== this.selectedTokenSell.ticker);
  }

  calculateTokenPrice = async (amount: number) => {
    this.tokenAmountToSpend = amount;
    this.tokenAmountToReceive = await this.priceIndexService.getTokenPrice(
      this.selectedTokenBuy.ticker,
      this.selectedTokenSell.ticker,
      amount.toString()
    );
  }

  getBalances = async () => {
    this.spendTokenBalance = await this.priceIndexService.getUserBalance(this.selectedTokenSell.ticker);
    this.receiveTokenBalance = await this.priceIndexService.getUserBalance(this.selectedTokenBuy.ticker);
  }

  swapTokens = () => {
    console.log('swap');
  }
}
