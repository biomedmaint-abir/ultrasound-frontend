import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContratList } from './contrat-list/contrat-list';
import { ContratForm } from './contrat-form/contrat-form';
import { ContratDetail } from './contrat-detail/contrat-detail';

const routes: Routes = [
  { path: '', component: ContratList },
  { path: 'new', component: ContratForm },
  { path: ':id', component: ContratDetail },
  { path: ':id/edit', component: ContratForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContratsRoutingModule {}