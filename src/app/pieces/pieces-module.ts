import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PiecesRoutingModule } from './pieces-routing-module';
import { PieceList } from './piece-list/piece-list';
import { PieceForm } from './piece-form/piece-form';
import { PieceDetail } from './piece-detail/piece-detail';

@NgModule({
  imports: [
    CommonModule,
    PiecesRoutingModule,
    PieceList,
    PieceForm,
    PieceDetail
  ]
})
export class PiecesModule {}