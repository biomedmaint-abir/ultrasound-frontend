import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanningRoutingModule } from './planning-routing.module';
import { PlanningComponent } from './planning.component';

@NgModule({
  imports: [
    CommonModule,
    PlanningRoutingModule,
    PlanningComponent
  ]
})
export class PlanningModule {}