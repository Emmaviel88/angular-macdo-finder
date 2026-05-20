import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoiSearch } from './poi-search';

describe('PoiSearch', () => {
  let component: PoiSearch;
  let fixture: ComponentFixture<PoiSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoiSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(PoiSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
