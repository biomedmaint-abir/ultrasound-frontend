import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PieceService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/pieces`); }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/pieces/${id}`); }
  create(piece: any): Observable<any> { return this.http.post<any>(`${this.apiUrl}/pieces`, piece); }
  update(id: number, piece: any): Observable<any> { return this.http.put<any>(`${this.apiUrl}/pieces/${id}`, piece); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/pieces/${id}`); }
}