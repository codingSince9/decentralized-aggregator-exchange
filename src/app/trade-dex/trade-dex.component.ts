import { Component, ElementRef, ViewChild } from '@angular/core';
import { PriceIndexService } from '../price-index.service';
import { TradeService } from '../trade.service';
import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-trade-dex',
  templateUrl: './trade-dex.component.html',
  styleUrls: ['./trade-dex.component.css'],
})

export class TradeDexComponent {
  constructor(
    private priceIndexService: PriceIndexService,
    private tradeService: TradeService,
    private notificationComponent: NotificationComponent
  ) { }

  // @ViewChild('popup') popupElement!: ElementRef;
  tokenAmountToSpend: number = 0;
  tokenAmountToReceive: number = 0;
  spendTokenBalance: number = 0;
  receiveTokenBalance: number = 0;
  showDivSell: boolean = false;
  showDivBuy: boolean = false;
  executingTrade: boolean = false;
  tokens: any[] = [
    { name: 'Bitcoin', ticker: 'WBTC', image: '/assets/images/bitcoin.png' },
    // { name: 'Ethereum', ticker: 'ETH', image: '/assets/images/ethereum.png' },
    { name: 'Matic', ticker: 'MATIC', image: '/assets/images/matic.png' },
    { name: 'USD Coin', ticker: 'USDC', image: '/assets/images/usdc.png' },
    { name: 'Chainlink', ticker: 'LINK', image: '/assets/images/chainlink.png' },
    { name: 'Sushi Swap', ticker: 'SUSHI', image: '/assets/images/sushiswap.png' },
  ];
  selectedTokenSell: any = this.tokens[2];
  selectedTokenBuy: any = this.tokens[1];
  tokensSell: any[] = this.tokens.filter((token) => token.ticker !== this.selectedTokenBuy.ticker);
  tokensBuy: any[] = this.tokens.filter((token) => token.ticker !== this.selectedTokenSell.ticker);

  ngOnInit(): void {
    this.getBalances();
  }

  // ngAfterViewInit() {
  //   document.addEventListener('click', (event) => {
  //     if (!this.popupElement.nativeElement.contains(event.target)) {
  //       this.showDivSell = false;
  //       this.showDivBuy = false;
  //     }
  //   });
  // }

  selectTokenSell(token: any) {
    this.selectedTokenSell = token;
    this.showDivSell = false;
    this.updateTokensToShow();
    this.getBalances();
    this.calculateTokenPrice(this.tokenAmountToSpend);
  }
  selectTokenBuy(token: any) {
    this.selectedTokenBuy = token;
    this.showDivBuy = false;
    this.updateTokensToShow();
    this.getBalances();
    this.calculateTokenPrice(this.tokenAmountToSpend);
  }

  swapBuyAndSellTokens() {
    let temp = this.selectedTokenSell;
    this.selectedTokenSell = this.selectedTokenBuy;
    this.selectedTokenBuy = temp;
    this.updateTokensToShow();
    this.calculateTokenPrice(this.tokenAmountToSpend);
    this.getBalances();
  }

  updateTokensToShow() {
    this.tokensSell = this.tokens.filter((token) => token.ticker !== this.selectedTokenBuy.ticker);
    this.tokensBuy = this.tokens.filter((token) => token.ticker !== this.selectedTokenSell.ticker);
  }

  calculateTokenPrice = async (amount: number) => {
    this.tokenAmountToSpend = amount;
    // this.tokenAmountToReceive = await this.priceIndexService.getTokenPrice(
    //   this.selectedTokenBuy.ticker,
    //   this.selectedTokenSell.ticker,
    //   amount.toString()
    // );
    if (this.selectedTokenBuy.ticker !== 'USDC' && this.selectedTokenSell.ticker !== 'USDC') {
      let usdcAmount = await this.tradeService.findBestLiquidity('USDC', this.selectedTokenSell.ticker, amount, true)
        .then((res) => {
          if (typeof res === 'number') {
            return res;
          } else {
            let amount = 0;
            for (let [, dexTradeSize] of Object.entries(res)) {
              if (dexTradeSize > 0)
                amount += dexTradeSize;
            }
            console.log(amount);
            return amount;
          }
        });
      this.tokenAmountToReceive = await this.tradeService.findBestLiquidity(this.selectedTokenBuy.ticker, 'USDC', usdcAmount, true)
        .then((res) => {
          if (typeof res === 'number') {
            return res;
          } else {
            let amount = 0;
            for (let [, dexTradeSize] of Object.entries(res)) {
              if (dexTradeSize > 0)
                amount += dexTradeSize;
            }
            console.log(amount);
            return amount;
          }
        });
    } else {
      this.tokenAmountToReceive = await this.tradeService.findBestLiquidity(
        this.selectedTokenBuy.ticker,
        this.selectedTokenSell.ticker,
        amount,
        true
      ).then((res) => {
        if (typeof res === 'number') {
          return res;
        } else {
          let amount = 0;
          console.log(res);
          console.log(typeof res);
          // for (let [, dexTradeSize] of Object.entries(res)) {
          //   console.log(dexTradeSize);
          //   console.log(typeof dexTradeSize);
          //   if (dexTradeSize > 0)
          //     amount += dexTradeSize;
          // }
          // console.log(amount);
          return Number(res);
        }
      });
    }
  }

  getBalances = async () => {
    this.spendTokenBalance = await this.priceIndexService.getUserBalance(this.selectedTokenSell.ticker);
    this.receiveTokenBalance = await this.priceIndexService.getUserBalance(this.selectedTokenBuy.ticker);
  }

  swapTokens = async () => {
    // disable button while executing trade


    this.executingTrade = true;
    const outcome = await this.tradeService.tokenSwap(
      this.selectedTokenBuy.ticker,
      this.selectedTokenSell.ticker,
      this.tokenAmountToSpend
    )
    this.notificationComponent.showNotification(outcome, this.tokenAmountToReceive, this.selectedTokenBuy.ticker);
    this.getBalances();
    this.executingTrade = false;
  }
}
