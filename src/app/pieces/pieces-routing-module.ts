import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PieceList } from './piece-list/piece-list';
import { PieceForm } from './piece-form/piece-form';
import { PieceDetail } from './piece-detail/piece-detail';

const routes: Routes = [
  { path: '', component: PieceList },
  { path: 'new', component: PieceForm },
  { path: ':id', component: PieceDetail },
  { path: ':id/edit', component: PieceForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PiecesRoutingModule {}