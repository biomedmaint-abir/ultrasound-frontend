import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
@Component({ selector: "app-fse-planning", standalone: true, imports: [CommonModule],
template: `<div style="padding:28px;background:#f8f9fc;min-height:100vh"><h1 style="color:#0d1340;font-size:26px;font-weight:800;margin:0 0 24px">Mon Planning</h1><p style="color:#6b7280">{{interventions.length}} intervention(s) planifiée(s)</p></div>`
})
export class FsePlanningComponent implements OnInit {
  email = localStorage.getItem("email") || "";
  nom = localStorage.getItem("nom") || "";
  interventions: any[] = [];
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({ next: (data) => { this.interventions = data.filter(i => i.nomFse === this.nom || i.nomFse === this.email); this.cdr.detectChanges(); } }); }
}