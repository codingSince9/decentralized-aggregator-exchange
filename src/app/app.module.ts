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
import { NotificationComponent } from './notification/notification.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    AppComponent,
    TradeDexComponent,
    TradePricesComponent,
    NotificationComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  providers: [
    UniswapService,
    DydxService,
    PriceIndexService,
    NotificationComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
