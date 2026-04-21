import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EquipementService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/equipements`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/equipements/${id}`);
  }

  create(equipement: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/equipements`, equipement);
  }

  update(id: number, equipement: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/equipements/${id}`, equipement);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/equipements/${id}`);
  }
}