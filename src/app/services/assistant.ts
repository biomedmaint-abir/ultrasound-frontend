import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  rechercherParCode(code: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/codes-erreur/recherche/${code}`);
  }

  getParModele(modeleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/codes-erreur/modele/${modeleId}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/codes-erreur`);
  }

  create(codeErreur: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/codes-erreur`, codeErreur);
  }

  // Recherche intelligente par symptôme avec score de confiance
  rechercherIntelligent(query: string, allCodes: any[]): any[] {
    const q = query.toLowerCase().trim();
    const results: any[] = [];

    allCodes.forEach(code => {
      let score = 0;
      const mots = q.split(' ').filter(m => m.length > 2);

      // Vérifier correspondance exacte code
      if (code.code?.toLowerCase() === q) score += 100;

      // Vérifier correspondance partielle code
      if (code.code?.toLowerCase().includes(q)) score += 80;

      // Vérifier symptômes
      mots.forEach((mot: string) => {
        if (code.symptomes?.toLowerCase().includes(mot)) score += 30;
        if (code.causesProbables?.toLowerCase().includes(mot)) score += 20;
        if (code.actionsCorrectives?.toLowerCase().includes(mot)) score += 15;
        if (code.piecesConcernees?.toLowerCase().includes(mot)) score += 10;
      });

      if (score > 0) {
        results.push({
          ...code,
          score: Math.min(score, 100),
          confiance: this.getConfiance(score)
        });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private getConfiance(score: number): string {
    if (score >= 80) return 'Très élevée';
    if (score >= 50) return 'Élevée';
    if (score >= 30) return 'Moyenne';
    return 'Faible';
  }

  getConfianceColor(confiance: string): string {
    switch (confiance) {
      case 'Très élevée': return '#2e7d32';
      case 'Élevée': return '#1565c0';
      case 'Moyenne': return '#e65100';
      default: return '#666';
    }
  }

  // Apprentissage - sauvegarder nouveau cas
  apprendreNouveauCas(cas: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/codes-erreur`, cas);
  }
}