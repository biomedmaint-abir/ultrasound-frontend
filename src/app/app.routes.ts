import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard-module').then(m => m.DashboardModule)
      },
      {
        path: 'interventions',
        loadChildren: () => import('./interventions/interventions-module').then(m => m.InterventionsModule)
      },
      {
        path: 'equipements',
        loadChildren: () => import('./equipements/equipements-module').then(m => m.EquipementsModule)
      },
      {
        path: 'pieces',
        loadChildren: () => import('./pieces/pieces-module').then(m => m.PiecesModule)
      },
      {
        path: 'contrats',
        loadChildren: () => import('./contrats/contrats-module').then(m => m.ContratsModule)
      },
      {
        path: 'planning',
        loadChildren: () => import('./planning/planning.module').then(m => m.PlanningModule)
      },
      {
        path: 'rapports',
        loadChildren: () => import('./rapports/rapports.module').then(m => m.RapportsModule)
      },
      {
        path: 'optimisation',
        loadChildren: () => import('./optimisation/optimisation.module').then(m => m.OptimisationModule)
      },
      {
        path: 'utilisateurs',
        loadChildren: () => import('./utilisateurs/utilisateurs.module').then(m => m.UtilisateursModule)
      },
      {
        path: 'historique',
        loadChildren: () => import('./historique/historique.module').then(m => m.HistoriqueModule)
      },
      {
        path: 'assistant-ia',
        loadChildren: () => import('./assistant-ia/assistant-ia-module').then(m => m.AssistantIaModule)
      },
    ]
  },
  { path: '**', component: NotFoundComponent }
];