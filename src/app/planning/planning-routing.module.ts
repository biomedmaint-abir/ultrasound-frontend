import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanningComponent } from './planning.component';
import { PlanningForm } from './planning-form/planning-form';

const routes: Routes = [
  { path: '', component: PlanningComponent },
  { path: 'nouveau', component: PlanningForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlanningRoutingModule {}
