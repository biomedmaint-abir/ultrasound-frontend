import { TestBed } from '@angular/core/testing';

import { Contrat } from './contrat';

describe('Contrat', () => {
  let service: Contrat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Contrat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
