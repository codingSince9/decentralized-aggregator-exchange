import { TestBed } from '@angular/core/testing';

import { OptimalTradeService } from './optimal-trade.service';

describe('OptimalTradeService', () => {
  let service: OptimalTradeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptimalTradeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
