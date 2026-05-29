import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Suggestion } from '../models/Suggestion';
import { POI } from '../models/poi';

@Injectable({
  providedIn: 'root',
})

export class NominatimSvc {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

  constructor(private http: HttpClient) {}

  // Recherche des suggestions correspondant à la saisie user
  searchSuggestions(query: string, limit: number): Observable<Suggestion[]> {

    // Tant que la saisie n'atteint pas 3 caractères, on ne fait pas de requête
    // Ce code ne devrait pas être utilisé car la Form n'est pas valide si l'input est < 3 caractères.
    if (query.length < 3) {
      return of([]);
    }
    // Configure les paramètres de la requête HTTP GET 
    const params = new HttpParams()
      .set('q', query + '+France')    // les recherches seront limitées à la France
      .set('format', 'json')          // format de réponse attendue
      .set('limit', limit.toString()) // nombre maxi de suggestions attendue (1) 
      .set('addressdetails', '1')     // active les détails d'adresse
      .set('accept-language', 'fr');  // si les traductions existent, demande les réponses en français

    return this.http.get<Suggestion[]>(`${this.NOMINATIM_BASE_URL}/search`, { // Envoi de la requête API 
      params 
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la recherche de suggestions', error);
        return of([]);
      })
    );
  }

  // Recherche des McDonald's à proximité du lieu sélectionné
  searchMcDo(place: string, limit: number = 5): Observable<POI[]>{
    // Configure les paramètres de la requête GET
    const params = new HttpParams ()
      .set('q', `McDonald's+${place}+France`) // Recherche des McDonald's à proximité du lieu sélectionné et en France
      .set('format', 'json')                  // format de réponse attendue
      .set('limit', `${limit}`)               // nombre maxi de POIs (selon la valeur de l'input number)
      .set('addressdetails', '1' )            // active les détails d'adresse
      .set('extratags', 1)                    // active les extratags (tél., adresse web, horaires s'ils sont connus)

      return this.http.get<POI[]>(`${this.NOMINATIM_BASE_URL}/search`, { // retourne le résultat de la requête API 
        params
      }).pipe(
        switchMap((results: any[]) => {
          return of(results.map((result, index) => ({
            id: index,
            name: result.display_name.split(',')[0] || 'McDonald\s',
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            address: {
              road: result.address?.road,
              city: result.address?.city || result.address?.town || result.address?.village,
              postcode: result.address?.postcode
            },
            details: {
              phone: result.extratags?.phone,
              website: result.extratags?.website,
              openHours: result.extratags?.opening_hours
            }
          }
        )));
    }),
    catchError(error => {
      console.error('Erreur lors de la recherche des McDonald\'s : ', error);
      return of([]);
    })
    );
  }

  // Récupération des détails du POI
  getPOIDetails(placeId: number): Observable<POI | any[] | null> {
    const params = new HttpParams()
      .set('place_id', placeId.toString())
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('accept-language', 'fr')

    return this.http.get<any>(`${this.NOMINATIM_BASE_URL}/details`, {
      params
      // headers: {'user-Agent': this.USER_AGENT}
    }).pipe(
      switchMap((result: any) => {
        if(!result) return of([]);
        return of({
          id: placeId,
          name: result.display_name.split(',')[0] || 'McDonald\'s',
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          address: {
              road: result.address.road,
              city: result.address?.city || result.address?.town || result.address?.village,
              postcode: result.address?.postcode
            },
          details: {
              phone: result.extratags?.phone,
              website: result.extratags?.website,
              openHours: result.extratags?.opening_hours
            } 
        })
        }
      ),
      catchError(error => {
        console.error('Erreur lors de la récupération des détails du POI', error);
        return of(null);
      })
    );
  }
}