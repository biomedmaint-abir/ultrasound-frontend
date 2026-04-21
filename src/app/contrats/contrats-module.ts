import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContratsRoutingModule } from './contrats-routing-module';
import { ContratList } from './contrat-list/contrat-list';
import { ContratForm } from './contrat-form/contrat-form';
import { ContratDetail } from './contrat-detail/contrat-detail';

@NgModule({
  imports: [
    CommonModule,
    ContratsRoutingModule,
    ContratList,
    ContratForm,
    ContratDetail
  ]
})
export class ContratsModule {}