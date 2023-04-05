import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TradeDexComponent } from './trade-dex/trade-dex.component';
import { FormsModule } from '@angular/forms';
import { TradePricesComponent } from './trade-prices/trade-prices.component';

@NgModule({
  declarations: [
    AppComponent,
    TradeDexComponent,
    TradePricesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
