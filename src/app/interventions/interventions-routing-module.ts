import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InterventionList } from './intervention-list/intervention-list';
import { InterventionForm } from './intervention-form/intervention-form';
import { InterventionDetail } from './intervention-detail/intervention-detail';

const routes: Routes = [
  { path: '', component: InterventionList },
  { path: 'new', component: InterventionForm },
  { path: ':id', component: InterventionDetail },
  { path: ':id/edit', component: InterventionForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InterventionsRoutingModule {}