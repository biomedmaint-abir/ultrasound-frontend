import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratList } from './contrat-list';

describe('ContratList', () => {
  let component: ContratList;
  let fixture: ComponentFixture<ContratList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratList],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
