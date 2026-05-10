import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statutFilter', standalone: true })
export class StatutFilterPipe implements PipeTransform {
  transform(pieces: any[], statut: string): number {
    if (!pieces) return 0;
    return pieces.filter(p => (p.statut || 'EN_STOCK') === statut).length;
  }
}
