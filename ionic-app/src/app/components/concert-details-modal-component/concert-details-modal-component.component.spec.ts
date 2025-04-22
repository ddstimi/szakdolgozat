import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConcertDetailsModalComponentComponent } from './concert-details-modal-component.component';

describe('ConcertDetailsModalComponentComponent', () => {
  let component: ConcertDetailsModalComponentComponent;
  let fixture: ComponentFixture<ConcertDetailsModalComponentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConcertDetailsModalComponentComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertDetailsModalComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
