import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Component({ selector: 'app-fse-dashboard', standalone: true, imports: [CommonModule, DatePipe],
template: `<div style="padding:28px;background:#f8f9fc;min-height:100vh"><h1 style="color:#0d1340;font-size:26px;font-weight:800">Bonjour {{nom && prenom ? nom + " " + prenom : email}} 👋</h1><p style="color:#6b7280">{{today | date:"EEEE dd MMMM yyyy"}}</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px"><div style="background:white;border-radius:16px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);border-top:4px solid #1a2eff"><div style="font-size:24px;font-weight:800;color:#0d1340">{{mesInterventions.length}}</div><div style="color:#6b7280;font-size:13px">Mes interventions</div></div><div style="background:white;border-radius:16px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);border-top:4px solid #f97316"><div style="font-size:24px;font-weight:800;color:#0d1340">{{interventionsUrgentes.length}}</div><div style="color:#6b7280;font-size:13px">En cours</div></div><div style="background:white;border-radius:16px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);border-top:4px solid #16A34A"><div style="font-size:24px;font-weight:800;color:#0d1340">{{terminees}}</div><div style="color:#6b7280;font-size:13px">Terminées</div></div></div></div>`
})
export class FseDashboardComponent implements OnInit {
  email = localStorage.getItem("email") || "";
  nom = localStorage.getItem("nom") || "";
  prenom = localStorage.getItem("prenom") || "";
  userId = Number(localStorage.getItem("userId")) || 0;
  prenom = localStorage.getItem("prenom") || "";
  today = new Date();
  mesInterventions: any[] = [];
  interventionsUrgentes: any[] = [];
  terminees = 0;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.mesInterventions = data.filter(i => i.technicien?.id === this.userId || i.nomFse === this.prenom || i.nomFse === this.nom || i.nomFse === this.email);
        this.interventionsUrgentes = this.mesInterventions.filter(i => i.statut === "EN_COURS");
        this.terminees = this.mesInterventions.filter(i => i.statut === "TERMINEE").length;
        this.cdr.detectChanges();
      }
    });
  }
}