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
  public poiSearchForm: FormGroup;        // Form pour la recherche
  public error = signal<string>('');      // Signal string pour afficher un message d'erreur à l'utilisateur
  public pois: POI[] = [];                // tableau de POI pour stocker les POIs trouvés
  public suggestions: Suggestion[] = [];  // tableau de Suggestions
  public selectedPlace = false;           // variable de getion de la sélection (pourrait être remplacée par un Signal<boolean>())

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
      switchMap(formValues => { // permet d'annuler la requête éventuellement en cours pour relancer la nouvelle si changement
        const { place, limit } = formValues;
        if(!place || place.trim().length <3) {
          this.suggestions = [];
          this.selectedPlace = false;
          this.error.set('');
          return of([]);
        } 
        // Lance la requête API pour trouver le lieu recherché (limité à 1 pour ne pas avoir de doublons)
        return this.nominatimSvc.searchSuggestions(place, 1);
      })      
    ).subscribe({
      next: results => {            // next est appelé en cas de succès de la requête
        if(results.length > 0) {
          this.suggestions = results; // récupère la suggestion
          this.selectedPlace = false; // Reset la variable selectedPlace
          this.error.set('');
          this.cdr.detectChanges();   // Force le refresh affichage
        } else {
          this.error.set('Aucune suggestion trouvée !');      // Set le signal pour afficher une alerte
        }
      },
      error: err => {               // error est appelé en cas d'erreur lors de la requête
        this.suggestions = [];      // vide le tableau de suggestions
        console.error(err);         // Affiche l'erreur dans la console
        this.error.set('Erreur lors de la recherche de suggestions');       // Set le signal
      }
    });
    if(!this.poiSearchForm.valid) { //
      this.suggestions = [];
      this.selectedPlace = false;
      this.cdr.detectChanges();
      this.error.set('');
    }
  }
  
  ngOnDestroy() {{}
    // this.subscriptions?.unsubscribe();
  }

  // Fonction appelée lros de la sélection de la suggestion
  selectSuggestion(suggestion: any): void {
    this.selectedPlace = true;    // Marque la sélection comme active
    this.suggestions = [];        // Reset le tableau de suggestions (ce qui a pour effet de masquer la DIV dans l'HTML)
    const mapCenter: POI[] = [{   // Mémorise le centre carte pour le transmettre à App via l'Output selectedPlace
            id: suggestion.place_id,
            name: suggestion.name,
            lat: parseFloat(suggestion.lat),
            lon: parseFloat(suggestion.lon) 
          }]

    this.poiSearchForm.patchValue(
      {
        place: suggestion.name  // Met à jour l'input text avec le texte de la sélection
      },
      {
        emitEvent: false        // pour empêcher de relancer la requête lors de la sélection d'une suggestion

      }
    );

    this.selectionPlace.emit(mapCenter);  // Émet le Signal Output vers App avec le centre carte en paramètre

  }

  // Appelée quand on clique le bouton Rechercher (qui n'est accessible qu'après sélection de la suggestion)
  onSearch() {
    // Récupère les valeurs des inputs "place" et "limit" 
    const {place, limit} = this.poiSearchForm.value;
    // Appelle la fonction searchMcDo du service nominatimSvc (avec les paramètres place et limit)
    this.nominatimSvc.searchMcDo(place, limit).subscribe({
      next: pois => {                 // next est appelé si la requête renvoie une réponse
        if(pois.length > 0) {         // Si la requête a renvoyé au moins un POI
          this.poisFound.emit(pois);  // émet le Signal poisFound vers App (en paramètre le tableau de POIS reçus de l'API)
          this.error.set('');         // Reset du signal error
        } else {
          alert('Aucun McDonald\'s trouvé autour de ce point'); // Si aucun POI n'a été retourné mais qu'il n'y a pas d'erreur, c'est un alert qui l'indique à l'utilisateur
          return;
        }
      },
      error: err => {
        console.error("Erreur lors de la recherche des McDonald\'s", err);
        this.error.set('Erreur lors de la recherche de McDonald\'s');
      }
    })

  }

  // FOnction de gestion du status 'invalid' de chaque input (text et number) appelé depuis le template
  isInvalid(controlName: string): boolean {
    const control = this.poiSearchForm.get(controlName);
    return !!control?.invalid && (control?.dirty || control?.touched);
  }

} 


  