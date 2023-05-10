import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeRoutingComponent } from './trade-routing.component';

describe('TradeRoutingComponent', () => {
  let component: TradeRoutingComponent;
  let fixture: ComponentFixture<TradeRoutingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradeRoutingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradeRoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
