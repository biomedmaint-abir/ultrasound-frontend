import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
@Component({ selector: "app-fse-interventions", standalone: true, imports: [CommonModule, FormsModule],
template: `<div style="padding:28px;background:#f8f9fc;min-height:100vh"><h1 style="color:#0d1340;font-size:26px;font-weight:800;margin:0 0 24px">Mes Interventions</h1><div *ngIf="isLoading" style="text-align:center;padding:48px;color:#6b7280">Chargement...</div><div *ngIf="!isLoading&&filtered.length===0" style="text-align:center;padding:48px;color:#9CA3AF">Aucune intervention assignée.</div><div *ngIf="!isLoading&&filtered.length>0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8f9fa"><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">#</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Date</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Type</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Équipement</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Statut</th></tr></thead><tbody><tr *ngFor="let inv of filtered" style="border-bottom:1px solid #f1f3f5"><td style="padding:14px 16px">{{inv.id}}</td><td style="padding:14px 16px">{{inv.dateIntervention | date:"dd/MM/yyyy"}}</td><td style="padding:14px 16px">{{inv.type}}</td><td style="padding:14px 16px">{{inv.equipement?.nom || "—"}}</td><td style="padding:14px 16px">{{inv.statut}}</td></tr></tbody></table></div></div>`
})
export class FseInterventionsComponent implements OnInit {
  email = localStorage.getItem("email") || "";
  nom = localStorage.getItem("nom") || "";
  filtered: any[] = [];
  isLoading = true;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => { this.filtered = data.filter(i => i.nomFse === this.nom || i.nomFse === this.email); this.isLoading = false; this.cdr.detectChanges(); }
    });
  }
}