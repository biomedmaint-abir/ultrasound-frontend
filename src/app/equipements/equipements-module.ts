import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipementsRoutingModule } from './equipements-routing-module';
import { EquipementList } from './equipement-list/equipement-list';
import { EquipementForm } from './equipement-form/equipement-form';
import { EquipementDetail } from './equipement-detail/equipement-detail';

@NgModule({
  imports: [
    CommonModule,
    EquipementsRoutingModule,
    EquipementList,
    EquipementForm,
    EquipementDetail
  ]
})
export class EquipementsModule {}