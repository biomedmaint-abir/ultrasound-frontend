import { Component } from '@angular/core';
import { AssistantComponent } from '../../assistant-ia/assistant/assistant';

@Component({
  selector: 'app-fse-assistant',
  standalone: true,
  imports: [AssistantComponent],
  template: `<app-assistant></app-assistant>`
})
export class FseAssistantComponent {}
