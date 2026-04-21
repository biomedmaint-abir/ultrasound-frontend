import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssistantService } from '../../services/assistant';

interface Message {
  type: 'user' | 'bot';
  text: string;
  time: string;
  result?: any;
  results?: any[];
  confidence?: number;
}

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant.html',
  styleUrl: './assistant.scss'
})
export class AssistantComponent implements OnInit, AfterViewChecked {

  @ViewChild('chatBody') chatBody!: ElementRef;

  searchCode = '';
  messages: Message[] = [];
  allCodes: any[] = [];
  isLoading = false;
  newKnowledge: any = null;
  showLearnForm = false;

  learnForm = {
    code: '',
    symptomes: '',
    causesProbables: '',
    actionsCorrectives: '',
    piecesConcernees: '',
    tempsResolutionMoyen: null as number | null
  };

  constructor(
    private assistantService: AssistantService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.assistantService.getAll().subscribe({
      next: (data: any[]) => {
        this.allCodes = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch (e) {}
  }

  // ✅ Recherche intelligente par code OU par symptôme
  search(): void {
    if (!this.searchCode.trim()) return;

    const query = this.searchCode.trim();
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    this.messages.push({ type: 'user', text: query, time });
    this.searchCode = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    // Déterminer si c'est un code erreur ou un symptôme
    const isCode = /^ERR-\d+$/i.test(query);

    if (isCode) {
      this.searchByCode(query, time);
    } else {
      this.searchBySymptom(query, time);
    }
  }

  // Recherche par code exact
  searchByCode(code: string, time: string): void {
    this.assistantService.rechercherParCode(code).subscribe({
      next: (data: any[]) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          data.forEach((result: any) => {
            const confidence = 100;
            this.messages.push({
              type: 'bot',
              text: `✅ Diagnostic trouvé pour <strong>${result.code}</strong> — Confiance : <strong>${confidence}%</strong>`,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              result: result,
              confidence: confidence
            });
          });
        } else {
          this.handleNotFound(code, time);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.handleError();
      }
    });
  }

  // ✅ Recherche intelligente par symptôme (pseudo-ML)
  searchBySymptom(query: string, time: string): void {
    setTimeout(() => {
      this.isLoading = false;
      const queryLower = query.toLowerCase();

      // Score de correspondance pour chaque code
      const scored = this.allCodes.map((code: any) => {
        let score = 0;
        const words = queryLower.split(' ').filter(w => w.length > 2);

        words.forEach(word => {
          if (code.symptomes?.toLowerCase().includes(word)) score += 40;
          if (code.causesProbables?.toLowerCase().includes(word)) score += 30;
          if (code.actionsCorrectives?.toLowerCase().includes(word)) score += 20;
          if (code.piecesConcernees?.toLowerCase().includes(word)) score += 10;
        });

        return { ...code, score, confidence: Math.min(score, 99) };
      }).filter((c: any) => c.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3);

      if (scored.length > 0) {
        const best = scored[0];
        this.messages.push({
          type: 'bot',
          text: `🧠 Analyse IA terminée — <strong>${scored.length} correspondance(s)</strong> trouvée(s) pour "<em>${query}</em>"`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          results: scored
        });
      } else {
        this.handleNotFound(query, time);
      }
      this.cdr.detectChanges();
    }, 1500); // Délai simulé pour l'effet IA
  }

  handleNotFound(query: string, time: string): void {
    this.newKnowledge = query;
    this.learnForm.code = /^ERR-/i.test(query) ? query.toUpperCase() : `ERR-${String(this.allCodes.length + 1).padStart(3, '0')}`;
    this.learnForm.symptomes = /^ERR-/i.test(query) ? '' : query;

    this.messages.push({
      type: 'bot',
      text: `❓ Aucun résultat pour "<strong>${query}</strong>". Ce cas est <strong>inconnu</strong> dans ma base de connaissances.<br><br>🤖 <em>Voulez-vous m'apprendre ce nouveau cas pour améliorer mes diagnostics futurs ?</em>`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    this.showLearnForm = true;
    this.cdr.detectChanges();
  }

  handleError(): void {
    this.messages.push({
      type: 'bot',
      text: 'Une erreur est survenue. Veuillez réessayer.',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    this.cdr.detectChanges();
  }

  // ✅ Apprentissage — ajouter un nouveau cas
  learn(): void {
    if (!this.learnForm.code || !this.learnForm.symptomes) return;

    this.assistantService.create(this.learnForm).subscribe({
      next: (data: any) => {
        this.allCodes.push(data);
        this.showLearnForm = false;
        this.messages.push({
          type: 'bot',
          text: `✅ <strong>Apprentissage réussi !</strong> Le code <strong>${this.learnForm.code}</strong> a été ajouté à ma base de connaissances. Je pourrai désormais diagnostiquer ce cas automatiquement.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
        this.learnForm = { code: '', symptomes: '', causesProbables: '', actionsCorrectives: '', piecesConcernees: '', tempsResolutionMoyen: null };
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages.push({
          type: 'bot',
          text: '❌ Erreur lors de l\'apprentissage. Veuillez réessayer.',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
        this.cdr.detectChanges();
      }
    });
  }

  cancelLearn(): void {
    this.showLearnForm = false;
    this.cdr.detectChanges();
  }

  goBack(): void { this.router.navigate(['/dashboard']); }
}