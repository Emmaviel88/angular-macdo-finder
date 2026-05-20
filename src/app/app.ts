import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PoiSearch } from './components/poi-search/poi-search';
import { Map } from './components/map/map'; 
import { POI } from './models/poi';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PoiSearch, Map],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  // Variable pour récupérer le centre carte (lieu séléctionné)
  selectionPlace: POI[] = [];

  // Variable pour contenir les POIs trouvés (par poiSearchForm) à transmettre à Map
  pois: POI[] = [];

  // Gestion du Output 'selectionPlace' issu de poi-search  
  onPlaceSelected(centreMap: POI[]){
    this.selectionPlace = centreMap;
  }

  // Gestion du Output 'poisFound' issu de poi-search
  onPoisFound(pois: POI[]): void {
    console.log('app L20: appel de onPoisFound', pois);
    this.pois = pois;
  }
}
