import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-trade-routing',
  templateUrl: './trade-routing.component.html',
  styleUrls: ['./trade-routing.component.css']
})
export class TradeRoutingComponent {

  usdcToken;
  percentages;
  tokenToTokenSwap;
  selectedTokenBuy;
  selectedTokenSell;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.usdcToken = data.usdcToken;
    this.percentages = data.percentages;
    this.tokenToTokenSwap = data.tokenToTokenSwap;
    this.selectedTokenBuy = data.selectedTokenBuy;
    this.selectedTokenSell = data.selectedTokenSell;
  }
}
