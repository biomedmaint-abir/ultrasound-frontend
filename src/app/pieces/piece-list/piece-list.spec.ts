import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieceList } from './piece-list';

describe('PieceList', () => {
  let component: PieceList;
  let fixture: ComponentFixture<PieceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieceList],
    }).compileComponents();

    fixture = TestBed.createComponent(PieceList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
