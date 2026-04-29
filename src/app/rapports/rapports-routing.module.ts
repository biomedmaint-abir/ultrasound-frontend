import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RapportsComponent } from './rapports.component';
import { RapportForm } from './rapport-form/rapport-form';

const routes: Routes = [
  { path: '', component: RapportsComponent },
  { path: 'nouveau', component: RapportForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RapportsRoutingModule {}