import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssistantIaRoutingModule } from './assistant-ia-routing-module';
import { AssistantComponent } from './assistant/assistant';

@NgModule({
  imports: [
    CommonModule,
    AssistantIaRoutingModule,
    AssistantComponent
  ]
})
export class AssistantIaModule {}