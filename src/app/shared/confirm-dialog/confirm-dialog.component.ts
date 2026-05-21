import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="overlay" *ngIf="visible" (click)="onCancel()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <div class="dialog-icon">{{ icon }}</div>
    <h3 class="dialog-title">{{ title }}</h3>
    <p class="dialog-message">{{ message }}</p>
    <div class="dialog-actions">
      <button class="btn-cancel" (click)="onCancel()">{{ cancelLabel }}</button>
      <button class="btn-confirm" [class.danger]="danger" (click)="onConfirm()">{{ confirmLabel }}</button>
    </div>
  </div>
</div>
  `,
  styles: [`
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; animation: fadeIn 0.15s ease;
}
.dialog {
  background: white; border-radius: 20px; padding: 36px 32px;
  width: 420px; max-width: 90vw; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: slideUp 0.2s ease;
}
.dialog-icon { font-size: 48px; margin-bottom: 12px; }
.dialog-title { margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #1C2B5A; }
.dialog-message { margin: 0 0 28px; font-size: 14px; color: #666; line-height: 1.6; }
.dialog-actions { display: flex; gap: 12px; justify-content: center; }
.btn-cancel {
  padding: 11px 28px; border: 2px solid #E9ECEF; background: white;
  border-radius: 12px; font-size: 14px; font-weight: 600; color: #666;
  cursor: pointer; transition: all 0.2s;
  &:hover { border-color: #ccc; background: #f5f5f5; }
}
.btn-confirm {
  padding: 11px 28px; border: none; background: #1C2B5A;
  border-radius: 12px; font-size: 14px; font-weight: 600; color: white;
  cursor: pointer; transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
  &.danger { background: #DC2626; }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Confirmer';
  @Input() message = 'Êtes-vous sûr ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Annuler';
  @Input() icon = '⚠️';
  @Input() danger = true;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel(): void { this.cancelled.emit(); }
}
