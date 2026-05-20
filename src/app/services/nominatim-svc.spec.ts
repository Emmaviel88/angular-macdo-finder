import { TestBed } from '@angular/core/testing';

import { NominatimSvc } from './nominatim-svc';

describe('NominatimSvc', () => {
  let service: NominatimSvc;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NominatimSvc);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
