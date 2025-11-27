import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { frontendService } from '../services/frontendService';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private frontendService: frontendService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    if (!this.frontendService.isLoggedIn()) {
      this.router
        .navigate(['/login'], {
          replaceUrl: true,
          state: { clearHistory: true },
        })
        .then(() => {
          this.forceRemoveStrayPages();
        });
      return false;
    }
    return true;
  }

  private forceRemoveStrayPages() {
    setTimeout(() => {
      const profilePage = document.querySelector('app-profile');
      if (profilePage) profilePage.remove();

      const homePage = document.querySelector('app-home');
      if (homePage) homePage.remove();
    }, 300);
  }
}
