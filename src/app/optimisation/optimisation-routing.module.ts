import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OptimisationComponent } from './optimisation.component';

const routes: Routes = [
  { path: '', component: OptimisationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OptimisationRoutingModule {}