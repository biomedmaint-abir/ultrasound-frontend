import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquipementList } from './equipement-list/equipement-list';
import { EquipementForm } from './equipement-form/equipement-form';
import { EquipementDetail } from './equipement-detail/equipement-detail';

const routes: Routes = [
  { path: '', component: EquipementList },
  { path: 'new', component: EquipementForm },
  { path: ':id', component: EquipementDetail },
  { path: ':id/edit', component: EquipementForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EquipementsRoutingModule {}