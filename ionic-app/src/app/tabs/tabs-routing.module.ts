import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { HomePage } from './home/home.page';
import { SearchPage } from './search/search.page';
import { ProfilePage } from './profile/profile.page';
import { EventsPage } from './events/events.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      { path: 'home', component: HomePage },
      { path: 'search', component: SearchPage },
      { path: 'events', component: EventsPage },
      { path: 'profile', component: ProfilePage },
      { path: '', redirectTo: '/tabs/home', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/tabs/home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
