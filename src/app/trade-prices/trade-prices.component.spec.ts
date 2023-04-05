import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradePricesComponent } from './trade-prices.component';

describe('TradePricesComponent', () => {
  let component: TradePricesComponent;
  let fixture: ComponentFixture<TradePricesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradePricesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradePricesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
