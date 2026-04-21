import { TestBed } from '@angular/core/testing';

import { Piece } from './piece';

describe('Piece', () => {
  let service: Piece;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Piece);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
