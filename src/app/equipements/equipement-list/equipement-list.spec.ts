import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipementList } from './equipement-list';

describe('EquipementList', () => {
  let component: EquipementList;
  let fixture: ComponentFixture<EquipementList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipementList],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipementList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
