import { Component, Input, OnChanges, signal, SimpleChanges, ChangeDetectorRef  } from '@angular/core';
import { POI } from '../../models/poi';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnChanges{
  // Input de type POI[] pour récupérer les POIs trouvés par poiSearchForm et transmis par App
  @Input() pois: POI[] = [];
  @Input() selectionPlace: POI[] = [];

  private map!: L.Map;
  public newMapCenter!: L.Marker;
  markers: L.Marker[] = [];
  public mcdoIcon!: L.Icon;
  public defIcon!: L.Icon;
  private mcDoFound : POI[] = [];
  private poisBounds: L.LatLngTuple[] = [];

  // variables pour stocker les coordonnées initiales de la carte (Paris) pour pouvoir y revenir lors du reset de la carte
  // Coordonnées de Paris par défaut
  private initialMapCenter = { lat: 47.0000, lng: 2.3522 }; // Paris
  private initialZoomLevel = 6; // Niveau de zoom par défaut
  // signal pour l'animation de l'affichage des détails du McDo quand l'utilsateur clique le bouton de son popup
  public selectedPlace : any | null = null;  

  constructor(private cdr: ChangeDetectorRef){}
  
  ngOnInit(): void {
    
  }
  
  ngAfterViewInit(): void {
    this.initMap();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // console.log('map.ts-L37 changes: ', changes);
    if(changes['selectionPlace'] && this.map) {
      const mapCenter = changes['selectionPlace']?.currentValue[0];
      console.log('map.ts-L40 : mapCenter', mapCenter)
      // Supprime le marker précédent s'il existe
      if(this.newMapCenter) {
        this.map.removeLayer(this.newMapCenter);
      }
      // this.addMarker(parseFloat(mapCenter.lat), parseFloat(mapCenter.lon), this.mcdoIcon, 0);
      const newMarker = L.marker([mapCenter.lat, mapCenter.lon])
        .addTo(this.map);
      // Centre la carte sur le point (le zoom sera ajusté pour montrer tous les POIs McDonald's) 
      this.map.setView([mapCenter.lat, mapCenter.lon]); 
      // mémorise le nouveau marker pour pouvoir le supprimer lors d'une prochaine recherche
      this.newMapCenter = newMarker; 
      // Efface les anciens markers McDonald's
      this.clearMarkers();
      return;
    }
    if(changes['pois']) {
      this.mcDoFound = changes['pois']?.currentValue;
      console.log('map.ts-L44 : POIs[]', this.mcDoFound);
      this.mcDoFound.forEach((item: any) => {
        this.addMarker(item.lat, item.lon, this.mcdoIcon, item.id+1);

        // Mémorise les coordonnées pour calcul des limites et adaptation du zoom
        this.poisBounds.push([item.lat, item.lon]);
      });
        console.log('map.ts-L69 : ', this.poisBounds);
        if (this.poisBounds.length > 0) {
          const bounds = L.latLngBounds(this.poisBounds);
          console.log(`map.ts-L72 : NW ${bounds.getNorthWest()} / ${bounds.getSouthEast()}`);
          this.map.fitBounds(bounds, {padding: [50, 50]});
        }
      return;
    }
  }

  private initMap(): void {
    // Initialisation de la carte (désactive le control zoom par défaut pour le personnaliser ensuite)
    this.map = L.map('map', {zoomControl: false}).setView(this.initialMapCenter, this.initialZoomLevel);    
    // Ajout d'un control zoom personnalisé en bas à gauche de la carte pour ne pas masquer la liste des suggestions de recherche qui s'affiche en haut à gauche
    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    // Ajout de la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Fix pour les icônes Leaflet manquantes
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    // Création icone personnalisée pour McDonald's
    this.mcdoIcon = L.icon({
      iconUrl: 'mcdonalds.ico',
      iconSize: [40, 30], // Taille de l'icône
      iconAnchor: [20, 30], // Point d'ancrage (centre en bas)
      popupAnchor: [0, -30] // Position de la popup
    });
  }

  resetMap(): void {
    // Réinitialiser la vue de la carte à la position initiale (Paris) et au niveau de zoom par défaut
    this.map.setView(this.initialMapCenter, this.initialZoomLevel);
  } 

  updateMarkers() {

    console.log('map.ts L23 : ', this.pois);
  }

  addMarker(lat: number, lng: number, mkr: L.Icon, id: number): void {
    // Ajouter un nouveau marker
    const newMarker = L.marker([lat, lng], { icon: mkr })
      .addTo(this.map)
      // Ajoute une popup avec les détails du POI (adresse, horaires, site web, téléphone, etc.) et un bouton
      .bindPopup(`<div class="popup-content" >
                        <h3>${id}. ${this.pois[id-1]?.name || 'POI'}</h3>
                        <h3>${this.pois[id-1]?.address?.postcode} -  ${this.pois[id-1]?.address?.city?.toUpperCase()}</h3>
                        <p><small>Lat: ${this.pois[id-1]?.lat} - Lon: ${this.pois[id-1]?.lon}</small>
                        <br><br>
                        <button class="marker-details-btn" data-index="${id}" style="width:100px;
                                                                                    height:40px;
                                                                                    border-radius:20px;
                                                                                    border:none;
                                                                                    cursor:pointer;
                                                                                    background: #007BFF;
                                                                                    color: white;">Selectionner</button>
                                                                                    </div>`);
    
    // Gestion de l'event click sur le bouton du popup ouvert 
    newMarker.on('popupopen', (e) => {
      // Récupère le popup ouvert
      const popup = e.popup.getElement();
      // Récupère le bouton du pospup par la classe
      const btn = popup?.querySelector('.marker-details-btn');
      // Ajoute un eventListener au bouton
      btn?.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLElement;
        // Récupère l'Id du POI (stocké dans data-index du bouton lors de la création de celui-ci)
        const index = target.dataset['index'];
        // Affiche la div avec les détails du McDo sélectionné
        this.selectedPlace = this.mcDoFound[Number(index)-1];
        this.cdr.detectChanges();
        newMarker.closePopup();
        console.log('map.ts-L124 : selectedPlace :', this.selectedPlace);
    });

});
    // AJoute le marker créé au tableau des markers
    this.markers.push(newMarker); // Stocker le marker dans le tableau
  }

  clearMarkers(): void {
    // Parcourir tous les markers et les supprimer de la carte
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = []; // Vider le tableau
    this.poisBounds = [];
  }

  formatOpeningHours(hours: string): string {

    const days: Record<string, string> = {
      Mo: 'Lun',
      Tu: 'Mar',
      We: 'Mer',
      Th: 'Jeu',
      Fr: 'Ven',
      Sa: 'Sam',
      Su: 'Dim'
    };

    return hours.replace(
      /\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g,
      (match) => days[match]
    );

  }
}
