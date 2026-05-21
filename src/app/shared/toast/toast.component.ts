import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="toast-container">
  @for (toast of toastService.toasts(); track toast.id) {
    <div class="toast toast-{{ toast.type }}" (click)="toastService.remove(toast.id)">
      <span class="toast-icon">{{ icons[toast.type] }}</span>
      <span class="toast-msg">{{ toast.message }}</span>
      <button class="toast-close" (click)="toastService.remove(toast.id)">✕</button>
    </div>
  }
</div>
  `,
  styles: [`
.toast-container {
  position: fixed;
  bottom: 28px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  cursor: pointer;
  animation: slideIn 0.25s ease;
  font-size: 14px;
  font-family: Calibri, sans-serif;
  min-width: 280px;
}
.toast-icon { font-size: 20px; }
.toast-msg { flex: 1; font-weight: 500; }
.toast-close {
  background: none; border: none; cursor: pointer;
  font-size: 14px; opacity: 0.6; padding: 0;
  &:hover { opacity: 1; }
}
.toast-success { background: #ECFDF5; color: #065F46; border-left: 4px solid #10B981; }
.toast-error   { background: #FEF2F2; color: #991B1B; border-left: 4px solid #EF4444; }
.toast-warning { background: #FFFBEB; color: #92400E; border-left: 4px solid #F59E0B; }
.toast-info    { background: #EFF6FF; color: #1E40AF; border-left: 4px solid #3B82F6; }
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
  icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
}
