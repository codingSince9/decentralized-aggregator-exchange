import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeDexComponent } from './trade-dex.component';

describe('TradeDexComponent', () => {
  let component: TradeDexComponent;
  let fixture: ComponentFixture<TradeDexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradeDexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradeDexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
