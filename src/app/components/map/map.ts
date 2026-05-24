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

  private map!: L.Map; // Créé la variable carte sans l'initialiser
  public newMapCenter!: L.Marker; // créé un marker pour positionner le centre carte sur le lieu sélectionné
  markers: L.Marker[] = []; // Tableau pour mémoriser les markers McDOnald's
  public mcdoIcon!: L.Icon; // icône spécifique McDo
  // public defIcon!: L.Icon; 
  private mcDoFound : POI[] = []; // Tableau pour mémoriser les POIs trouvés
  private poisBounds: L.LatLngTuple[] = []; // Tableau de tuples [lat, lon] pour e calcul des limites d'affichage

  // variables pour stocker les coordonnées initiales de la carte (Paris) pour pouvoir y revenir lors du reset de la carte
  // Coordonnées de Paris par défaut
  private initialMapCenter = { lat: 47.0000, lng: 2.3522 }; // Paris
  private initialZoomLevel = 6; // Niveau de zoom par défaut
  // variable pour l'animation de l'affichage des détails du McDo quand l'utilsateur clique le bouton de son popup
  // - Si false : affiche le popup "Aucun restaurant sélectionné"
  // - Si true  : affiche le popup des détails du McDonald's sélectionné
  public selectedPlace : any | null = null;  

  // COnstructeur avec détection de changements (pour forcer le refresh d'affichage)
  constructor(private cdr: ChangeDetectorRef){}
  
  ngOnInit(): void {
    
  }
  
  // Appel de l'initialisation d ela carte après avoir créé les éléments qui y seront appelés.
  ngAfterViewInit(): void {
    this.initMap();
  }
  
  // OnChanges est appelé si un changement est intervenu sur un signals poiSearch.selectedPlace() ou poisSearch.poisFound().
  ngOnChanges(changes: SimpleChanges) {
    // Test si le changement porte sur selectedPlace()
    if(changes['selectionPlace'] && this.map) {
      // récupère le 1er POI (d'index 0) dans le tableau. La variable changes peut contenir 1 ou plusieurs POIs selon que OnCHanges est appelé 
      // pour la sélection d'une suggestion ou pour les McDos trouvés 
      const mapCenter = changes['selectionPlace']?.currentValue[0];
      
      // Supprime le marker 'centre de carte' précédent s'il existe
      if(this.newMapCenter) {
        this.map.removeLayer(this.newMapCenter);
      }

      // Ajoute un marker 'std' sur la suggestion sélectionnée
      // Ici on utilise le marker par défaut
      const newMarker = L.marker([mapCenter.lat, mapCenter.lon])
        .addTo(this.map);
      
      // Centre la carte sur le point (le zoom sera ajusté pour montrer tous les POIs McDonald's) 
      this.map.setView([mapCenter.lat, mapCenter.lon]); 
      
      // Mémorise le nouveau marker pour pouvoir le supprimer lors d'une prochaine recherche
      this.newMapCenter = newMarker; 
      
      // Efface les anciens markers McDonald's quand l'utilisateur a sélectionné un nouveau lieu
      this.clearMarkers();
      return;
    }

    // Test si le changement porte sur poisFound() => McDos
    if(changes['pois']) {
      // Récupère le tableau des McDos trouvés (retournés par Nominatim)
      this.mcDoFound = changes['pois']?.currentValue;
      // Parcours le tableau pour et ... 
      this.mcDoFound.forEach((item: any) => {
        // ...appelle addMarker pour ajouter un marker par restaurant
        this.addMarker(item.lat, item.lon, this.mcdoIcon, item.id+1);

        // Mémorise les coordonnées pour calcul des limites et adaptation du zoom
        this.poisBounds.push([item.lat, item.lon]);
      });

        // Calcule les limites de l'affichage pour voir tous les McDos trouvés
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
    // Ajout d'un control zoom personnalisé (en haut à droite) de la carte pour ne pas masquer la liste des suggestions de recherche qui s'affiche en haut à gauche
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

  // Fonction d'ajout des markers McDos (avec popup et bouton intégré de sélection)
  addMarker(lat: number, lng: number, mkr: L.Icon, id: number): void {
    // Ajouter un nouveau marker
    const newMarker = L.marker([lat, lng], { icon: mkr })
      .addTo(this.map)
      // Ajoute un popup avec les détails du POI (adresse, horaires, site web, téléphone, etc.) et un bouton
      // L'ajout se fait sous la forme de code HTML
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
        // Récupère les données (détails) du POIs dans la variable selectedPlace 
        // Dans le code HTML, la div est affichée si la variable n'est pas nulle
        this.selectedPlace = this.mcDoFound[Number(index)-1];
        // Force l'appel du refresh de l'affichage
        this.cdr.detectChanges();
        // Ferme le popup quand on clique sur le bouton
        newMarker.closePopup();
    });

});
    // Ajoute le marker créé au tableau des markers
    this.markers.push(newMarker); // Stocker le marker dans le tableau
  }

  clearMarkers(): void {
    // Parcourir tous les markers et les supprimer de la carte
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = []; // Vider le tableau
    this.poisBounds = []; // et celui qui sert à calculer les limites d'affichage des POIs trouvés
  }

  // Pour remplacer les noms de jours reçus en anglais
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
