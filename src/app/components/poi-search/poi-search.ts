import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NominatimSvc } from '../../services/nominatim-svc';
import { POI } from '../../models/poi';
import { Suggestion } from '../../models/Suggestion';
import { debounceTime, distinctUntilChanged, switchMap, filter, Subscription, of } from 'rxjs';

@Component({
  selector: 'app-poi-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './poi-search.html',
  styleUrl: './poi-search.css',
})

export class PoiSearch implements OnInit, OnDestroy {
  public poiSearchForm: FormGroup;
  public error = signal(''); 
  public pois: POI[] = [];
  public suggestions: Suggestion[] = [];
  public selectedPlace = false;

  // Output pour la position centrale de la carte
  @Output() selectionPlace = new EventEmitter<POI[]>();
  
  // Output pour les POIs (McDonald's) trouvés 
  @Output() poisFound = new EventEmitter<POI[]>();
  
  constructor(private router: Router, private nominatimSvc: NominatimSvc, private cdr: ChangeDetectorRef) {
    this.poiSearchForm = new FormGroup({
      place: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
      limit: new FormControl<number>(5, [Validators.min(1), Validators.max(20)]),
    });
  }
  
  ngOnInit(): void {
    
    // Détecte les changements de valeurs dans searchForm (place ou limit)
    this.poiSearchForm.valueChanges.pipe(
      debounceTime(300), // Ne réagit que 300ms après la dernière entrée au clavier
      distinctUntilChanged(), // Ne réagit que si il y a eu changement  
      switchMap(formValues => {
        const { place, limit } = formValues;
        if(!place || place.trim().length <3) {
          this.suggestions = [];
          this.selectedPlace = false;
          return of([]);
        } 
        // Lance la requête API pour trouver le lieu   
        return this.nominatimSvc.searchSuggestions(place, 1);
      })      
    ).subscribe({
      next: results => {
        this.suggestions = results;
        console.log('poi-search-L46 : Suggestions', this.suggestions);
        this.selectedPlace = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.suggestions = [];
        console.error(err);
      }
    });
    if(!this.poiSearchForm.valid) {
      this.suggestions = [];
      this.selectedPlace = false;
      this.cdr.detectChanges();
    }
  }
  
  ngOnDestroy() {{}
    // this.subscriptions?.unsubscribe();
  }

  selectSuggestion(suggestion: any): void {
    this.selectedPlace = true;
    this.suggestions = [];
    const mapCenter: POI[] = [{
            id: suggestion.place_id,
            name: suggestion.name,
            lat: parseFloat(suggestion.lat),
            lon: parseFloat(suggestion.lon) 
          }]

    this.poiSearchForm.patchValue(
      {
        place: suggestion.name
      },
      {
        // pour empêcher de relancer la requête lors de la sélection d'une suggestion
        emitEvent: false
      }
    );

    this.selectionPlace.emit(mapCenter);

  }

  onSearch() {
    // Récupère les valeurs des inputs "place" et "limit" 
    const {place, limit} = this.poiSearchForm.value;
    
    this.nominatimSvc.searchMcDo(place, limit).subscribe({
      next: pois => {
        if(pois.length > 0) {
          console.log('poiSearch L94: POIs:', pois);
          this.poisFound.emit(pois);
        } else {
          alert('Aucun McDonald\'s trouvé autour de ce point');
          return;
        }
      },
      error: err => {
        console.error("Erreur lors de la recherche des McDonald\'s", err);
      }
    })

  }

  // Gestion du status 'invalid' des inputs
  isInvalid(controlName: string): boolean {
    const control = this.poiSearchForm.get(controlName);
    return !!control?.invalid && (control?.dirty || control?.touched);
  }

} 


  