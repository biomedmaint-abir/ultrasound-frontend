import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="overlay" *ngIf="visible" (click)="onCancel()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <div class="dialog-icon-wrap">
      <div class="dialog-icon">🗑️</div>
    </div>
    <h3 class="dialog-title">{{ title }}</h3>
    <p class="dialog-message">{{ message }}</p>
    <div class="dialog-divider"></div>
    <div class="dialog-actions">
      <button class="btn-cancel" (click)="onCancel()">{{ cancelLabel }}</button>
      <button class="btn-confirm" [class.danger]="danger" (click)="onConfirm()">{{ confirmLabel }}</button>
    </div>
  </div>
</div>
  `,
  styles: [`
.overlay {
  position: fixed; inset: 0; background: rgba(13,19,64,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; animation: fadeIn 0.15s ease;
}
.dialog {
  background: white; border-radius: 24px; padding: 40px 36px 32px;
  width: 460px; max-width: 90vw; text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.15);
  animation: slideUp 0.2s ease;
}
.dialog-icon-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  background: #FEF2F2; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 20px;
}
.dialog-icon { font-size: 32px; }
.dialog-title {
  margin: 0 0 12px; font-size: 22px; font-weight: 800;
  color: #0d1340;
}
.dialog-message {
  margin: 0 0 24px; font-size: 14px; color: #6b7280;
  line-height: 1.7;
}
.dialog-divider {
  height: 1px; background: #f1f3f5; margin: 0 -36px 24px;
}
.dialog-actions {
  display: flex; gap: 12px; justify-content: center;
}
.btn-cancel {
  flex: 1; padding: 13px 24px; border: 1.5px solid #e2e6f0;
  background: white; border-radius: 12px;
  font-size: 15px; font-weight: 700; color: #0d1340;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: #f8f9fc; }
}
.btn-confirm {
  flex: 1; padding: 13px 24px; border: none;
  background: #1a2eff; border-radius: 12px;
  font-size: 15px; font-weight: 700; color: white;
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
  @Input() icon = '🗑️';
  @Input() danger = true;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel(): void { this.cancelled.emit(); }
}