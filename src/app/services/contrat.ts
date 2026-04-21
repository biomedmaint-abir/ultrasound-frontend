import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContratService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/contrats`, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/contrats/${id}`, { headers: this.getHeaders() });
  }

  create(contrat: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/contrats`, contrat, { headers: this.getHeaders() });
  }

  update(id: number, contrat: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/contrats/${id}`, contrat, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/contrats/${id}`, { headers: this.getHeaders() });
  }
}