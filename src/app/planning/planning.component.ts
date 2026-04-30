import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.scss'
})
export class PlanningComponent implements OnInit {

  interventions: any[] = [];
  equipements: any[] = [];
  isLoading = true;

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  calendarDays: any[] = [];

  form = {
    dateIntervention: '',
    type: '',
    description: '',
    equipementId: null as number | null,
    dureeHeures: null as number | null
  };

  types = ['PREVENTIF', 'CORRECTIF', 'MISE_A_JOUR'];
  isSaving = false;
  successMessage = '';

  monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private http: HttpClient,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.buildCalendar();
  }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/interventions`).subscribe({
      next: (data) => {
        this.interventions = data;
        this.buildCalendar();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
    this.http.get<any[]>(`${environment.apiUrl}/equipements`).subscribe({
      next: (data) => { this.equipements = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push({ day: null, interventions: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayInterventions = this.interventions.filter(i => i.dateIntervention?.startsWith(dateStr));
      days.push({ day: d, date: dateStr, interventions: dayInterventions });
    }
    this.calendarDays = days;
    this.cdr.detectChanges();
  }

  getInterventionsDuMois(): any[] {
    return this.interventions.filter(i => {
      if (!i.dateIntervention) return false;
      const date = new Date(i.dateIntervention);
      return date.getMonth() === this.currentMonth && date.getFullYear() === this.currentYear;
    });
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.buildCalendar();
  }

  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() &&
      this.currentMonth === today.getMonth() &&
      this.currentYear === today.getFullYear();
  }

  planifier(): void {
    if (!this.form.dateIntervention || !this.form.type) return;
    this.isSaving = true;
    const payload = {
      dateIntervention: this.form.dateIntervention,
      type: this.form.type,
      descriptionPanne: this.form.description,
      dureeHeures: this.form.dureeHeures,
      statut: 'EN_COURS',
      equipement: this.form.equipementId ? { id: this.form.equipementId } : null
    };
    this.http.post(`${environment.apiUrl}/interventions`, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Intervention planifiée avec succès !';
        this.form = { dateIntervention: '', type: '', description: '', equipementId: null, dureeHeures: null };
        this.loadData();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'CORRECTIF': return 'type-correctif';
      case 'PREVENTIF': return 'type-preventif';
      case 'MISE_A_JOUR': return 'type-maj';
      default: return '';
    }
  }

  goBack(): void { this.router.navigate(['/dashboard']); }
}