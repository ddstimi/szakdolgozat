import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/authService';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      // Force complete navigation cleanup
      this.router
        .navigate(['/login'], {
          replaceUrl: true, // Replace current route in history
          state: { clearHistory: true }, // Clear navigation history
        })
        .then(() => {
          // Manual DOM cleanup for Ionic's web components
          this.forceRemoveStrayPages();
        });
      return false;
    }
    return true;
  }

  private forceRemoveStrayPages() {
    setTimeout(() => {
      const pages = document.querySelectorAll(
        'ion-router-outlet > .ion-page:not(.ion-page-active)'
      );
      pages.forEach((page) => page.remove());

      const profilePage = document.querySelector('app-profile');
      if (profilePage) profilePage.remove();

      const homePage = document.querySelector('app-home');
      if (homePage) homePage.remove();
    }, 300);
  }
}
