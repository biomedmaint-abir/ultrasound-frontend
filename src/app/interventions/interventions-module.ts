import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterventionsRoutingModule } from './interventions-routing-module';
import { InterventionList } from './intervention-list/intervention-list';
import { InterventionForm } from './intervention-form/intervention-form';
import { InterventionDetail } from './intervention-detail/intervention-detail';

@NgModule({
  imports: [
    CommonModule,
    InterventionsRoutingModule,
    InterventionList,
    InterventionForm,
    InterventionDetail
  ]
})
export class InterventionsModule {}