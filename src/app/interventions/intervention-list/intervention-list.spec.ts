import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterventionList } from './intervention-list';

describe('InterventionList', () => {
  let component: InterventionList;
  let fixture: ComponentFixture<InterventionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterventionList],
    }).compileComponents();

    fixture = TestBed.createComponent(InterventionList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
