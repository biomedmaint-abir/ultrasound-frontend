import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RapportsRoutingModule } from './rapports-routing.module';
import { RapportsComponent } from './rapports.component';

@NgModule({
  imports: [
    CommonModule,
    RapportsRoutingModule,
    RapportsComponent
  ]
})
export class RapportsModule {}