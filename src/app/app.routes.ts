import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { FseLayoutComponent } from './fse-layout/fse-layout.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AdminGuard } from './guards/admin.guard';
import { FseGuard } from './guards/fse.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },

  // ── ROUTES ADMIN ──
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard-module').then(m => m.DashboardModule) },
      { path: 'interventions', loadChildren: () => import('./interventions/interventions-module').then(m => m.InterventionsModule) },
      { path: 'equipements', loadChildren: () => import('./equipements/equipements-module').then(m => m.EquipementsModule) },
      { path: 'pieces', loadChildren: () => import('./pieces/pieces-module').then(m => m.PiecesModule) },
      { path: 'contrats', loadChildren: () => import('./contrats/contrats-module').then(m => m.ContratsModule) },
      { path: 'planning', loadChildren: () => import('./planning/planning.module').then(m => m.PlanningModule) },
      { path: 'planning/assign/:id', loadComponent: () => import('./planning/assign-fse/assign-fse.component').then(m => m.AssignFseComponent) },
      { path: 'rapports', loadChildren: () => import('./rapports/rapports.module').then(m => m.RapportsModule) },
      { path: 'optimisation', loadChildren: () => import('./optimisation/optimisation.module').then(m => m.OptimisationModule) },
      { path: 'utilisateurs', loadChildren: () => import('./utilisateurs/utilisateurs.module').then(m => m.UtilisateursModule) },
      { path: 'historique', loadChildren: () => import('./historique/historique.module').then(m => m.HistoriqueModule) },
      { path: 'assistant-ia', loadChildren: () => import('./assistant-ia/assistant-ia-module').then(m => m.AssistantIaModule) },
      { path: 'profil', loadComponent: () => import('./profil/profil.component').then(m => m.ProfilComponent) },
    ]
  },

  // ── ROUTES FSE ──
  {
    path: 'fse',
    component: FseLayoutComponent,
    canActivate: [FseGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./fse/fse-dashboard/fse-dashboard.component').then(m => m.FseDashboardComponent) },
      { path: 'interventions', loadComponent: () => import('./fse/fse-interventions/fse-interventions.component').then(m => m.FseInterventionsComponent) },
      { path: 'equipements', loadComponent: () => import('./fse/fse-equipements/fse-equipements.component').then(m => m.FseEquipementsComponent) },
      { path: 'equipements/:id', loadComponent: () => import('./fse/fse-equipement-detail/fse-equipement-detail.component').then(m => m.FseEquipementDetailComponent) },
      { path: 'planning', loadComponent: () => import('./fse/fse-planning/fse-planning.component').then(m => m.FsePlanningComponent) },
      { path: 'rapports', loadComponent: () => import('./fse/fse-rapports/fse-rapports.component').then(m => m.FseRapportsComponent) },
      { path: 'historique', loadComponent: () => import('./fse/fse-historique/fse-historique.component').then(m => m.FseHistoriqueComponent) },
      { path: 'cloture/:id', loadComponent: () => import('./fse/fse-cloture/fse-cloture.component').then(m => m.FseClotureComponent) },
      { path: 'assistant-ia', loadComponent: () => import('./fse/fse-assistant/fse-assistant.component').then(m => m.FseAssistantComponent) },
      { path: 'profil', loadComponent: () => import('./fse/fse-profil/fse-profil.component').then(m => m.FseProfilComponent) },
    ]
  },

  { path: '**', component: NotFoundComponent }
];