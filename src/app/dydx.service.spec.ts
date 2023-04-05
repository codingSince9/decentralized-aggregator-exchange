import { TestBed } from '@angular/core/testing';

import { DydxService } from './dydx.service';

describe('DydxService', () => {
  let service: DydxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DydxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
