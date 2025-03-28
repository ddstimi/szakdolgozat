import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConcertCardComponent } from './concert-card.component';

describe('ConcertCardComponent', () => {
  let component: ConcertCardComponent;
  let fixture: ComponentFixture<ConcertCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ConcertCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
