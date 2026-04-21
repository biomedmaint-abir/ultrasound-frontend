import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptimisationRoutingModule } from './optimisation-routing.module';
import { OptimisationComponent } from './optimisation.component';

@NgModule({
  imports: [
    CommonModule,
    OptimisationRoutingModule,
    OptimisationComponent
  ]
})
export class OptimisationModule {}