import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fse-planning',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <h1>Mon Planning</h1>
    <p>{{ interventions.length }} intervention(s) planifiée(s)</p>
  </div>

  <!-- Calendrier -->
  <div class="calendar-card">
    <div class="cal-nav">
      <button (click)="prevMonth()">‹</button>
      <span class="cal-title">{{ currentDate | date:'MMMM yyyy' : undefined : 'fr' }}</span>
      <button (click)="nextMonth()">›</button>
    </div>
    <div class="cal-grid">
      <div class="cal-day-header" *ngFor="let d of ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']">{{ d }}</div>
      <div *ngFor="let cell of calendarCells" class="cal-cell"
        [class.other-month]="!cell.currentMonth"
        [class.today]="cell.isToday"
        [class.selected]="selectedDate === cell.dateStr"
        [class.has-interventions]="cell.interventions.length > 0"
        (click)="selectDay(cell)">
        <span class="cal-day-num">{{ cell.day }}</span>
        <div class="cal-dots">
          <span *ngFor="let inv of cell.interventions.slice(0,3)" class="cal-dot" [ngClass]="getDotClass(inv.type)"></span>
        </div>
      </div>
    </div>
  </div>

  <!-- Interventions du jour sélectionné -->
  <div *ngIf="selectedDate && selectedInterventions.length > 0" class="day-detail">
    <h3>📅 {{ selectedDateLabel }}</h3>
    <div *ngFor="let inv of selectedInterventions" class="intervention-card" (click)="router.navigate(['/fse/cloture', inv.id])">
      <div class="card-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ inv.dateIntervention | date:'MMM' | uppercase }}</span>
          <span class="date-day">{{ inv.dateIntervention | date:'dd' }}</span>
        </div>
      </div>
      <div class="card-center">
        <div class="card-title">{{ inv.equipement?.nom || '—' }}</div>
        <div class="card-sub">{{ inv.equipement?.parc || '—' }}</div>
        <div class="card-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
      </div>
      <div class="card-right">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)"><span class="dot"></span>{{ inv.statut }}</span>
      </div>
    </div>
  </div>

  <div *ngIf="selectedDate && selectedInterventions.length === 0" class="empty-day">
    Aucune intervention ce jour.
  </div>

  <!-- Liste complète -->
  <div class="section-title">Toutes mes interventions</div>
  <div *ngIf="interventions.length === 0" class="empty-state">
    <p>📅 Aucune intervention planifiée pour le moment.</p>
  </div>
  <div class="interventions-list" *ngIf="interventions.length > 0">
    <div *ngFor="let inv of interventions" class="intervention-card" (click)="router.navigate(['/fse/cloture', inv.id])">
      <div class="card-left">
        <div class="date-block" [ngClass]="getTypeClass(inv.type)">
          <span class="date-month">{{ inv.dateIntervention | date:'MMM' | uppercase }}</span>
          <span class="date-day">{{ inv.dateIntervention | date:'dd' }}</span>
        </div>
      </div>
      <div class="card-center">
        <div class="card-title">{{ inv.equipement?.nom || '—' }}</div>
        <div class="card-sub">{{ inv.equipement?.parc || '—' }}</div>
        <div class="card-desc" *ngIf="inv.descriptionPanne">{{ inv.descriptionPanne }}</div>
      </div>
      <div class="card-right">
        <span class="type-badge" [ngClass]="getTypeClass(inv.type)">{{ inv.type }}</span>
        <span class="statut-badge" [ngClass]="getStatutClass(inv.statut)"><span class="dot"></span>{{ inv.statut }}</span>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.page-container{max-width:900px;margin:0 auto;padding:28px 32px;background:#f8f9fc;min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif}
.page-header{margin-bottom:24px} h1{margin:0;font-size:26px;font-weight:800;color:#0d1340} p{margin:4px 0 0;color:#6b7280;font-size:13px}
.calendar-card{background:white;border-radius:16px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:24px}
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.cal-nav button{background:#f8f9fc;border:1.5px solid #e2e6f0;border-radius:8px;padding:6px 14px;font-size:18px;cursor:pointer;color:#0d1340}
.cal-title{font-size:16px;font-weight:700;color:#0d1340;text-transform:capitalize}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal-day-header{text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;padding:4px 0}
.cal-cell{min-height:56px;border-radius:8px;padding:4px;cursor:pointer;transition:background .15s;display:flex;flex-direction:column;align-items:center}
.cal-cell:hover{background:#f0f4ff}
.cal-cell.other-month .cal-day-num{color:#D1D5DB}
.cal-cell.today{background:#EFF6FF} .cal-cell.today .cal-day-num{color:#1C2B5A;font-weight:800}
.cal-cell.selected{background:#1C2B5A} .cal-cell.selected .cal-day-num{color:white;font-weight:800}
.cal-cell.has-interventions .cal-day-num{font-weight:700}
.cal-day-num{font-size:13px;color:#374151;margin-bottom:2px}
.cal-dots{display:flex;gap:2px;flex-wrap:wrap;justify-content:center}
.cal-dot{width:6px;height:6px;border-radius:50%}
.dot-correctif{background:#DC2626} .dot-preventif{background:#16A34A} .dot-maj{background:#1a2eff}
.day-detail{background:white;border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.day-detail h3{margin:0 0 16px;font-size:15px;font-weight:700;color:#0d1340}
.empty-day{text-align:center;padding:16px;color:#9CA3AF;font-size:13px;background:white;border-radius:12px;margin-bottom:24px}
.section-title{font-size:16px;font-weight:700;color:#0d1340;margin-bottom:12px}
.interventions-list{display:flex;flex-direction:column;gap:12px}
.intervention-card{background:white;border-radius:14px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;align-items:center;gap:16px;cursor:pointer;transition:box-shadow .2s}
.intervention-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.date-block{display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:10px;min-width:60px;text-align:center}
.date-month{font-size:10px;font-weight:700;text-transform:uppercase} .date-day{font-size:22px;font-weight:800;line-height:1.1}
.type-correctif{background:#FEE2E2;color:#DC2626} .type-preventif{background:#DCFCE7;color:#16A34A} .type-maj{background:#DBEAFE;color:#1a2eff}
.card-center{flex:1} .card-title{font-size:15px;font-weight:700;color:#0d1340} .card-sub{font-size:12px;color:#6b7280;margin-top:2px} .card-desc{font-size:12px;color:#9CA3AF;margin-top:4px}
.card-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.type-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.statut-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.statut-terminee{background:#DCFCE7;color:#16A34A} .statut-en_cours{background:#DBEAFE;color:#1D4ED8}
.statut-en_attente{background:#FEF9C3;color:#CA8A04} .statut-en_attente_validation{background:#F3E8FF;color:#7C3AED}
.statut-en_attente_piece{background:#FEE2E2;color:#DC2626}
.empty-state{text-align:center;padding:48px;color:#9CA3AF;font-size:14px;background:white;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  `]
})
export class FsePlanningComponent implements OnInit {
  email = localStorage.getItem('email') || '';
  nom = localStorage.getItem('nom') || '';
  prenom = localStorage.getItem('prenom') || '';
  userId = Number(localStorage.getItem('userId')) || 0;
  interventions: any[] = [];
  calendarCells: any[] = [];
  currentDate = new Date();
  selectedDate = '';
  selectedDateLabel = '';
  selectedInterventions: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, public router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data.filter(i =>
          i.technicien?.id === this.userId ||
          i.nomFse === this.prenom || i.nomFse === this.nom ||
          i.nomFse === this.email ||
          i.nomFse === (this.prenom + ' ' + this.nom).trim() ||
          i.nomFse === (this.nom + ' ' + this.prenom).trim()
        );
        this.buildCalendar();
        this.cdr.detectChanges();
      }
    });
  }

  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    this.calendarCells = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = d.toISOString().slice(0, 10);
      this.calendarCells.push({ day: d.getDate(), dateStr, currentMonth: false, isToday: false, interventions: this.getInterventionsForDate(dateStr) });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().slice(0, 10);
      this.calendarCells.push({ day: d, dateStr, currentMonth: true, isToday: dateStr === todayStr, interventions: this.getInterventionsForDate(dateStr) });
    }

    const remaining = 42 - this.calendarCells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const dateStr = date.toISOString().slice(0, 10);
      this.calendarCells.push({ day: d, dateStr, currentMonth: false, isToday: false, interventions: this.getInterventionsForDate(dateStr) });
    }
  }

  getInterventionsForDate(dateStr: string): any[] {
    return this.interventions.filter(i => i.dateIntervention === dateStr);
  }

  selectDay(cell: any): void {
    this.selectedDate = cell.dateStr;
    this.selectedInterventions = cell.interventions;
    const d = new Date(cell.dateStr);
    this.selectedDateLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  getDotClass(type: string): string {
    return type === 'CORRECTIF' ? 'cal-dot dot-correctif' : type === 'PREVENTIF' ? 'cal-dot dot-preventif' : 'cal-dot dot-maj';
  }

  getTypeClass(t: string): string { return t === 'CORRECTIF' ? 'type-correctif' : t === 'PREVENTIF' ? 'type-preventif' : 'type-maj'; }
  getStatutClass(s: string): string {
    switch(s) {
      case 'TERMINEE': return 'statut-terminee';
      case 'EN_COURS': return 'statut-en_cours';
      case 'EN_ATTENTE': return 'statut-en_attente';
      case 'EN_ATTENTE_VALIDATION': return 'statut-en_attente_validation';
      case 'EN_ATTENTE_PIECE': return 'statut-en_attente_piece';
      default: return 'statut-en_attente';
    }
  }
}
