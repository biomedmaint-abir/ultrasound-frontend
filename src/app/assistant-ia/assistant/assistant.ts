import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AssistantService } from '../../services/assistant';
import { environment } from '../../../environments/environment';

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
  @ViewChild('fileInput') fileInput!: ElementRef;

  searchCode = '';
  messages: Message[] = [];
  allCodes: any[] = [];
  documentsPhilips: any[] = [];
  isLoading = false;
  isAnalyzingImage = false;
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
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.assistantService.getAll().subscribe({
      next: (data: any[]) => { this.allCodes = data; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.loadDocumentsPhilips();
  }

  ngAfterViewChecked(): void { this.scrollToBottom(); }

  scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch (e) {}
  }

  loadDocumentsPhilips(): void {
    this.http.get<any[]>(`${environment.apiUrl}/documents-philips`).subscribe({
      next: (data) => { this.documentsPhilips = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  sauvegarderDocument(data: any): void {
    const payload = {
      titre: `Document Philips — ${data.code || 'Sans code'}`,
      contenu: `Symptômes: ${data.symptomes || ''} | Causes: ${data.causesProbables || ''} | Actions: ${data.actionsCorrectives || ''} | Pièces: ${data.piecesConcernees || ''}`,
      modeleEquipement: '',
      codeErreur: data.code || ''
    };
    this.http.post(`${environment.apiUrl}/documents-philips`, payload).subscribe({
      next: () => {
        this.loadDocumentsPhilips();
        this.messages.push({
          type: 'bot',
          text: `📚 <strong>Document sauvegardé dans la base documentaire !</strong> Il sera utilisé pour améliorer les diagnostics futurs.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  rechercherDansDocuments(query: string): any[] {
    const q = query.toLowerCase();
    return this.documentsPhilips.filter(doc =>
      doc.contenu?.toLowerCase().includes(q) ||
      doc.codeErreur?.toLowerCase().includes(q) ||
      doc.titre?.toLowerCase().includes(q)
    ).slice(0, 3);
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      type: 'user',
      text: `📷 Image envoyée : <strong>${file.name}</strong>`,
      time
    });

    this.isAnalyzingImage = true;
    this.cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result.split(',')[1];
      const mediaType = file.type;

      this.http.post<any>('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            {
              type: 'text',
              text: `Tu es un expert en maintenance des équipements d'échographie Philips. 
              Analyse ce document/image et extrait les informations suivantes en JSON uniquement:
              {
                "code": "code erreur si présent (format ERR-XXX)",
                "symptomes": "symptômes décrits",
                "causesProbables": "causes probables",
                "actionsCorrectives": "actions correctives recommandées",
                "piecesConcernees": "pièces concernées si mentionnées"
              }
              Si tu ne trouves pas d'informations pertinentes, réponds avec null.`
            }
          ]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      }).subscribe({
        next: (response: any) => {
          this.isAnalyzingImage = false;
          const text = response.content[0]?.text || '';
          try {
            const clean = text.replace(/```json|```/g, '').trim();
            const data = JSON.parse(clean);
            if (data) {
              // Sauvegarder automatiquement dans la base documentaire
              this.sauvegarderDocument(data);

              this.messages.push({
                type: 'bot',
                text: `🔍 <strong>Analyse de l'image terminée !</strong><br><br>
                  📋 <strong>Code :</strong> ${data.code || 'Non détecté'}<br>
                  🔴 <strong>Symptômes :</strong> ${data.symptomes || '—'}<br>
                  🧠 <strong>Causes :</strong> ${data.causesProbables || '—'}<br>
                  🔧 <strong>Actions :</strong> ${data.actionsCorrectives || '—'}<br>
                  🔩 <strong>Pièces :</strong> ${data.piecesConcernees || '—'}<br><br>
                  💡 <em>Voulez-vous aussi ajouter ce cas à la base de codes erreur ?</em>`,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              });
              this.learnForm = {
                code: data.code || `ERR-${String(this.allCodes.length + 1).padStart(3, '0')}`,
                symptomes: data.symptomes || '',
                causesProbables: data.causesProbables || '',
                actionsCorrectives: data.actionsCorrectives || '',
                piecesConcernees: data.piecesConcernees || '',
                tempsResolutionMoyen: null
              };
              this.showLearnForm = true;
            } else {
              this.messages.push({
                type: 'bot',
                text: '❌ Aucune information pertinente détectée. Essayez avec un document de code d\'erreur Philips.',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              });
            }
          } catch {
            this.messages.push({
              type: 'bot',
              text: `🔍 Analyse : ${text}`,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.isAnalyzingImage = false;
          this.messages.push({
            type: 'bot',
            text: '❌ Erreur lors de l\'analyse de l\'image.',
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          });
          this.cdr.detectChanges();
        }
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  search(): void {
    if (!this.searchCode.trim()) return;
    const query = this.searchCode.trim();
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ type: 'user', text: query, time });
    this.searchCode = '';
    this.isLoading = true;
    this.cdr.detectChanges();
    const isCode = /^ERR-\d+$/i.test(query);
    if (isCode) {
      this.searchByCode(query, time);
    } else {
      this.searchBySymptom(query, time);
    }
  }

  searchByCode(code: string, time: string): void {
    this.assistantService.rechercherParCode(code).subscribe({
      next: (data: any[]) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          data.forEach((result: any) => {
            this.messages.push({
              type: 'bot',
              text: `✅ Diagnostic trouvé pour <strong>${result.code}</strong> — Confiance : <strong>100%</strong>`,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              result: result,
              confidence: 100
            });
          });
        } else {
          // Chercher dans les documents Philips
          const docsResults = this.rechercherDansDocuments(code);
          if (docsResults.length > 0) {
            this.messages.push({
              type: 'bot',
              text: `📚 <strong>Trouvé dans la base documentaire Philips !</strong><br><br>${docsResults.map(d => `📄 ${d.titre}<br>${d.contenu}`).join('<br><br>')}`,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            });
          } else {
            this.handleNotFound(code, time);
          }
        }
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.handleError(); }
    });
  }

  searchBySymptom(query: string, time: string): void {
    setTimeout(() => {
      this.isLoading = false;
      const queryLower = query.toLowerCase();

      // 1. Chercher dans les codes erreur
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

      // 2. Chercher dans les documents Philips
      const docsResults = this.rechercherDansDocuments(query);

      if (scored.length > 0) {
        this.messages.push({
          type: 'bot',
          text: `🧠 Analyse IA — <strong>${scored.length} correspondance(s)</strong> trouvée(s) pour "<em>${query}</em>"`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          results: scored
        });
      }

      if (docsResults.length > 0) {
        this.messages.push({
          type: 'bot',
          text: `📚 <strong>Trouvé dans ${docsResults.length} document(s) Philips :</strong><br><br>${docsResults.map(d => `📄 <strong>${d.titre}</strong><br><small>${d.contenu?.substring(0, 200)}...</small>`).join('<br><br>')}`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
      }

      if (scored.length === 0 && docsResults.length === 0) {
        this.handleNotFound(query, time);
      }

      this.cdr.detectChanges();
    }, 1500);
  }

  handleNotFound(query: string, time: string): void {
    this.newKnowledge = query;
    this.learnForm.code = /^ERR-/i.test(query) ? query.toUpperCase() : `ERR-${String(this.allCodes.length + 1).padStart(3, '0')}`;
    this.learnForm.symptomes = /^ERR-/i.test(query) ? '' : query;
    this.messages.push({
      type: 'bot',
      text: `❓ Aucun résultat pour "<strong>${query}</strong>". Ce cas est <strong>inconnu</strong>.<br><br>🤖 <em>Voulez-vous m'apprendre ce nouveau cas ?</em>`,
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

  learn(): void {
    if (!this.learnForm.code || !this.learnForm.symptomes) return;
    this.assistantService.create(this.learnForm).subscribe({
      next: (data: any) => {
        this.allCodes.push(data);
        this.showLearnForm = false;
        this.messages.push({
          type: 'bot',
          text: `✅ <strong>Apprentissage réussi !</strong> Le code <strong>${this.learnForm.code}</strong> a été ajouté à ma base de connaissances.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
        this.learnForm = { code: '', symptomes: '', causesProbables: '', actionsCorrectives: '', piecesConcernees: '', tempsResolutionMoyen: null };
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages.push({
          type: 'bot',
          text: '❌ Erreur lors de l\'apprentissage.',
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