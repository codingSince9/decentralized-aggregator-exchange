import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

interface Market {
  market: string;
  baseAsset: string;
  indexPrice: string;
  quoteAsset: string;
  trades24H: string;
  volume24H: string;
}

@Injectable({
  providedIn: 'root'
})

export class DydxService {

  private apiUrl = 'https://api.dydx.exchange/v3';
  markets: Market[] = [];
  private marketsToFetch = [
    'ETH-USD',
    'BTC-USD',
    'LINK-USD',
    'MATIC-USD',
    'SUSHI-USD',
  ];

  constructor(private http: HttpClient) { }

  getPairs() {
    const result = this.http.get(`${this.apiUrl}/markets`).pipe(
      map((response: any) => response.markets)
    );
    this.markets = [];
    result.subscribe((markets: any) => {
      Object.keys(markets).forEach((key) => {
        const value = markets[key];
        // console.log(key, value);
        if (this.marketsToFetch.includes(value.market)) {
          this.markets.push(value);
        }
      });
    });
    return this.markets;
  }
}