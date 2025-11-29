import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/authService';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    await this.router.navigate(['/login'], {
      replaceUrl: true,
      state: { clearHistory: true },
    });

    this.authService.forceRemoveStrayPages();
    return false;
  }
}
