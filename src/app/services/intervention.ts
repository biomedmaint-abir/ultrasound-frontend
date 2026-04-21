import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InterventionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/interventions`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/interventions/${id}`);
  }

  create(intervention: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/interventions`, intervention);
  }

  update(id: number, intervention: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/interventions/${id}`, intervention);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/interventions/${id}`);
  }

  getMTTR(): Observable<number> {
    return this.http.get<number> (`${this.apiUrl}/interventions/mttr`);
  }
}