import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TradeDexComponent } from './trade-dex/trade-dex.component';
import { FormsModule } from '@angular/forms';
import { TradePricesComponent } from './trade-prices/trade-prices.component';
import { UniswapService } from './uniswap.service';
import { DydxService } from './dydx.service';
import { PriceIndexService } from './price-index.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TradeRoutingComponent } from './trade-routing/trade-routing.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AvailableTokensComponent } from './available-tokens/available-tokens.component';


@NgModule({
  declarations: [
    AppComponent,
    TradeDexComponent,
    TradePricesComponent,
    TradePricesComponent,
    TradeRoutingComponent,
    AvailableTokensComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    BrowserAnimationsModule
  ],
  providers: [
    UniswapService,
    DydxService,
    PriceIndexService,
    TradeDexComponent,
    TradePricesComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
