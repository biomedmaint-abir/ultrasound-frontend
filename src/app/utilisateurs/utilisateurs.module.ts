import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilisateursRoutingModule } from './utilisateurs-routing.module';
import { UtilisateursComponent } from './utilisateurs.component';

@NgModule({
  imports: [CommonModule, UtilisateursRoutingModule, UtilisateursComponent]
})
export class UtilisateursModule {}