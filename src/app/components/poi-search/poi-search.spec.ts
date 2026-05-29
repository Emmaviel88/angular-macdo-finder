import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs'
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PoiSearch } from './poi-search';
import { NominatimSvc } from '../../services/nominatim-svc';

describe('PoiSearch Component Tests', () => {
  let component: PoiSearch;
  let fixture: ComponentFixture<PoiSearch>;

  const nominatimSvcMock = {
    searchSuggestions: vi.fn(),
    searchMcDo: vi.fn()
  };

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, PoiSearch],
      providers: [
              {
        provide: NominatimSvc,
        useValue: nominatimSvcMock
      }
      ]
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

  it('should call NominatimSvc.searchSuggestions when place has at least 3 chars', async () => {

    const mockSuggestions = [
      { name: 'Paris', 
        lat: '1', 
        lon: '2',
        place_id: 123,
        addresstype: 'test' 
      }
    ];

    nominatimSvcMock.searchSuggestions.mockReturnValue(of(mockSuggestions));

    fixture.detectChanges(); // lance ngOnInit

    component.poiSearchForm.patchValue({
      place: 'Paris',
      limit: '5'
    });

    await new Promise(resolve => setTimeout(resolve, 350));

    fixture.detectChanges();

    expect(nominatimSvcMock.searchSuggestions).toHaveBeenCalledWith('Paris', 5);
    // console.log('Suggestions: ', component.suggestions);
    expect(component.suggestions).toEqual(mockSuggestions);

  });

  it('should call onSearch and then nominatimSvc.searchMcDo when clicking button', () => {

    nominatimSvcMock.searchMcDo = vi.fn().mockReturnValue(of([]));

    const onSearchSpy = vi.spyOn(component, 'onSearch');

    component.poiSearchForm.setValue({
      place: 'Paris',
      limit: 5
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');

    button.dispatchEvent(new Event('click'));

    fixture.detectChanges();

    expect(onSearchSpy).toHaveBeenCalled();

    expect(nominatimSvcMock.searchMcDo).toHaveBeenCalledWith('Paris', 5);

  });
});
