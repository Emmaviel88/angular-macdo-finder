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

  it('should create component poiSearch', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when place has less than 3 chars', () => {
    component.poiSearchForm.setValue({ place: 'pa', limit: 5 });
    expect(component.poiSearchForm.controls['place'].invalid).toBe(true);
  })

  it('form should be invalid when limit is below minimum = 1', () => {
    component.poiSearchForm.setValue({ place: 'Paris', limit: 0 });
    expect(component.poiSearchForm.controls['limit'].invalid).toBe(true);
  });

  it('form should be invalid when limit is above maximum = 20', () => {
    component.poiSearchForm.setValue({ place: 'Paris', limit: 21 });
    expect(component.poiSearchForm.controls['limit'].invalid).toBe(true);
  });
  
  it('form should be valid with correct values', () => {
    component.poiSearchForm.setValue({ place: 'Paris', limit: 10 });
    expect(component.poiSearchForm.valid).toBe(true);
  });

  it('should update place control when selecting a suggestion, empty suggestions[] and set selectedPlace to True', () => {
    const suggestion = { place_id: 1, name: 'Paris' };
    component.selectSuggestion(suggestion) as any;
    expect(component.poiSearchForm.controls['place'].value).toBe('Paris');
    expect(component.selectedPlace).toBe(true);
    expect(component.suggestions.length).toBe(0);
  });
});
