import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { PriceIndexService } from '../price-index.service';
import { TradeService, TradeSize, USDC_TOKEN_SYMBOL } from '../trade.service';
import { UniswapService } from '../uniswap.service';
import { TradePricesComponent } from '../trade-prices/trade-prices.component';
import { TradeRoutingComponent } from '../trade-routing/trade-routing.component';
import { AvailableTokensComponent } from '../available-tokens/available-tokens.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';


export interface Percentage {
  exchangeName: string,
  percentageAmount: number,
  ticker: string,
}

@Component({
  selector: 'app-trade-dex',
  templateUrl: './trade-dex.component.html',
  styleUrls: ['./trade-dex.component.css'],
})

export class TradeDexComponent {
  constructor(
    private priceIndexService: PriceIndexService,
    private tradeService: TradeService,
    private tradePricesComponent: TradePricesComponent,
    private routingDialog: MatDialog,
    private tokenDialog: MatDialog,
  ) { }

  // @ViewChild('popup') popupElement!: ElementRef;
  tokenAmountToSpend: number = 0;
  tokenAmountToReceive: number = 0;
  percentages: Percentage[] = [];
  tokenRoute: string[] = [];
  spendTokenBalance: number = 0;
  receiveTokenBalance: number = 0;
  showDivSell: boolean = false;
  showDivBuy: boolean = false;
  showRoute: boolean = false;
  executingTrade: boolean = false;
  usdcToken = { name: 'USD Coin', ticker: USDC_TOKEN_SYMBOL, image: '/assets/images/usdc.png' };
  tokens: any[] = [
    { name: 'Bitcoin', ticker: 'WBTC', image: '/assets/images/bitcoin.png' },
    // { name: 'Ethereum', ticker: 'ETH', image: '/assets/images/ethereum.png' },
    { name: 'Matic', ticker: 'MATIC', image: '/assets/images/matic.png' },
    this.usdcToken,
    { name: 'Chainlink', ticker: 'LINK', image: '/assets/images/chainlink.png' },
    { name: 'Sushi Swap', ticker: 'SUSHI', image: '/assets/images/sushiswap.png' },
  ];
  selectedTokenSell: any = this.tokens[4];
  selectedTokenBuy: any = this.tokens[3];
  tokenToTokenSwap: boolean = false;
  tokensSell: any[] = this.tokens.filter((token) => token.ticker !== this.selectedTokenBuy.ticker);
  tokensBuy: any[] = this.tokens.filter((token) => token.ticker !== this.selectedTokenSell.ticker);

  ngOnInit(): void {
    this.getBalances();
    this.isTokenToTokenSwap();
  }

  openRoutingDialog() {
    this.routingDialog.open(TradeRoutingComponent, {
      width: '700px',
      data: {
        usdcToken: this.usdcToken,
        percentages: this.percentages,
        tokenToTokenSwap: this.tokenToTokenSwap,
        selectedTokenBuy: this.selectedTokenBuy,
        selectedTokenSell: this.selectedTokenSell,
      }
    });
  }

  openTokenDialog(openedTokenToSell: boolean) {
    const dialogRef: MatDialogRef<AvailableTokensComponent> = this.tokenDialog.open(AvailableTokensComponent, {
      width: '250px',
      data: {
        openedTokenToSell: openedTokenToSell,
        tokensToShow: openedTokenToSell ? this.tokensSell : this.tokensBuy,
        selectedTokenBuy: this.selectedTokenBuy,
        selectedTokenSell: this.selectedTokenSell,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.event == "Token Select") {
        openedTokenToSell ? this.selectTokenSell(result.data) : this.selectTokenBuy(result.data);
      }
    });
  }

  isTokenToTokenSwap() {
    this.tokenToTokenSwap = this.selectedTokenSell.ticker !== USDC_TOKEN_SYMBOL && this.selectedTokenBuy.ticker !== USDC_TOKEN_SYMBOL;
  }

  selectTokenSell(token: any) {
    this.tokenDialog.closeAll();
    this.selectedTokenSell = token;
    this.showDivSell = false;
    this.updateTokensToShow();
    this.getBalances();
    this.calculateTokenPrice(this.tokenAmountToSpend);
    this.isTokenToTokenSwap();
  }
  selectTokenBuy(token: any) {
    this.tokenDialog.closeAll();
    this.selectedTokenBuy = token;
    this.showDivBuy = false;
    this.updateTokensToShow();
    this.getBalances();
    this.calculateTokenPrice(this.tokenAmountToSpend);
    this.isTokenToTokenSwap();
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

  correctExchangeName(exchangeName: string) {
    if (exchangeName === "illiquidDex") {
      return "Non liquid DEX";
    } else if (exchangeName === "liquidDex") {
      return "Liquid DEX";
    } else {
      return "Uniswap";
    }
  }

  setPercentages(percentages: any, ticker: string, amount: number) {
    let exchangeName: string;
    for (let [key, value] of Object.entries(percentages)) {
      if (Number(value) > 0) {
        exchangeName = this.correctExchangeName(key);
        let percentage = (value as number / amount) * 100;
        // limit percentage to 3 decimal places
        percentage = Math.round((percentage + Number.EPSILON) * 1000) / 1000;
        this.percentages.push({ exchangeName: exchangeName, percentageAmount: percentage, ticker: ticker });
      }
    }
  }

  calculateTokenPrice = async (amount: number) => {
    this.percentages = [];
    this.tokenAmountToSpend = amount;

    if (this.selectedTokenBuy.ticker !== USDC_TOKEN_SYMBOL && this.selectedTokenSell.ticker !== USDC_TOKEN_SYMBOL) {
      let usdcAmount = await this.tradeService.findBestLiquidity(USDC_TOKEN_SYMBOL, this.selectedTokenSell.ticker, amount, true) as number;
      const amountsToUsdc = await this.tradeService.findBestLiquidity(USDC_TOKEN_SYMBOL, this.selectedTokenSell.ticker, amount, false) as TradeSize;
      this.setPercentages(amountsToUsdc, USDC_TOKEN_SYMBOL, amount);

      this.tokenAmountToReceive = await this.tradeService.findBestLiquidity(this.selectedTokenBuy.ticker, USDC_TOKEN_SYMBOL, usdcAmount, true) as number;
      const amountsToToken = await this.tradeService.findBestLiquidity(USDC_TOKEN_SYMBOL, this.selectedTokenSell.ticker, usdcAmount, false) as TradeSize;
      this.setPercentages(amountsToToken, this.selectedTokenBuy.ticker, usdcAmount);
      this.tokenRoute = [this.selectedTokenSell.ticker, ">", USDC_TOKEN_SYMBOL, ">", this.selectedTokenBuy.ticker];
    } else {
      this.tokenAmountToReceive = await this.tradeService.findBestLiquidity(
        this.selectedTokenBuy.ticker,
        this.selectedTokenSell.ticker,
        amount,
        true
      ) as number;

      const amountsToUsdc = await this.tradeService.findBestLiquidity(this.selectedTokenBuy.ticker, this.selectedTokenSell.ticker, amount, false) as TradeSize;
      this.setPercentages(amountsToUsdc, USDC_TOKEN_SYMBOL, amount);
      this.tokenRoute = this.selectedTokenSell.ticker == USDC_TOKEN_SYMBOL ?
        [USDC_TOKEN_SYMBOL, ">", this.selectedTokenBuy.ticker] : [this.selectedTokenSell.ticker, ">", USDC_TOKEN_SYMBOL];
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
    this.getBalances();
    this.executingTrade = false;
  }
}
