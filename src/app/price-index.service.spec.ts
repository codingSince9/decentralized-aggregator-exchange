import { TestBed } from '@angular/core/testing';

import { PriceIndexService } from './price-index.service';

describe('PriceIndexService', () => {
  let service: PriceIndexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceIndexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
