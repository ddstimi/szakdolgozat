import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then((m) => m.TabsModule),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs/event-details',
    loadComponent: () =>
      import('./tabs/concert-details/concert-details.page').then(
        (m) => m.ConcertDetailsPage
      ),
  },
  {
    path: 'tabs/profile/notifications',
    loadComponent: () =>
      import('./tabs/profile/notifications/notifications.page').then(
        (m) => m.NotificationsPage
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'tabs/events',
    loadComponent: () =>
      import('./tabs/events/events.page').then((m) => m.EventsPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'tabs/profile',
    loadComponent: () =>
      import('./tabs/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
