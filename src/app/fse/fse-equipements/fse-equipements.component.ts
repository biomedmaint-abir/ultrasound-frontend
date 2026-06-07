import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
@Component({ selector: "app-fse-equipements", standalone: true, imports: [CommonModule, FormsModule],
template: `<div style="padding:28px;background:#f8f9fc;min-height:100vh"><h1 style="color:#0d1340;font-size:26px;font-weight:800;margin:0 0 24px">Équipements</h1><p style="color:#6b7280;margin:0 0 16px">Consultation uniquement — {{filtered.length}} équipement(s)</p><div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8f9fa"><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Modèle</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">N° Série</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Service</th><th style="padding:14px 16px;font-size:12px;font-weight:600;color:#6b7280;text-align:left">Parc</th></tr></thead><tbody><tr *ngFor="let e of filtered" style="border-bottom:1px solid #f1f3f5"><td style="padding:14px 16px;font-weight:600">{{e.nom}}</td><td style="padding:14px 16px">{{e.numeroSerie||"—"}}</td><td style="padding:14px 16px">{{e.service||"—"}}</td><td style="padding:14px 16px">{{e.parc||"—"}}</td></tr></tbody></table></div></div>`
})
export class FseEquipementsComponent implements OnInit {
  filtered: any[] = [];
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({ next: (data) => { this.filtered = data; this.cdr.detectChanges(); } }); }
}