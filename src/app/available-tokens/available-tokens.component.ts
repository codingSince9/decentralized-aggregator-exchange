import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TradeDexComponent } from '../trade-dex/trade-dex.component';

@Component({
  selector: 'app-available-tokens',
  templateUrl: './available-tokens.component.html',
  styleUrls: ['./available-tokens.component.css']
})
export class AvailableTokensComponent {

  openedTokenToSell;
  tokensToShow;
  selectedTokenBuy;
  selectedTokenSell;

  constructor(
    public dialogRef: MatDialogRef<AvailableTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private tradeDexComponent: TradeDexComponent,
  ) {
    this.openedTokenToSell = data.openedTokenToSell;
    this.tokensToShow = data.tokensToShow;
    this.selectedTokenBuy = data.selectedTokenBuy;
    this.selectedTokenSell = data.selectedTokenSell;
  }

  selectToken(token: any) {
    this.dialogRef.close({ event: "Token Select", data: token });
  }

  closeDialog() {
    this.dialogRef.close({ event: "Cancel" });
  }
}
