import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConcertDetailsPage } from './concert-details.page';

describe('ConcertDetailsPage', () => {
  let component: ConcertDetailsPage;
  let fixture: ComponentFixture<ConcertDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConcertDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
