import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ModalController, IonicModule } from '@ionic/angular';
import { GdprModalComponent } from './gdpr-modal/gdpr-modal/gdpr-modal.component';
import { AuthService } from '../services/authService';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage implements OnInit, AfterViewInit {
  isSignUp = false;
  isLoading = false;

  loginData = {
    username: '',
    password: '',
  };

  registerData = {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gdpr: false,
  };

  stayLoggedIn = false;

  private googleScriptPromise?: Promise<void>;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private modalController: ModalController
  ) {}

  ngOnInit() {}

  async ngAfterViewInit() {
    await this.loadGoogleScript();
    this.renderButton();
  }

  private loadGoogleScript(): Promise<void> {
    if (this.googleScriptPromise) {
      return this.googleScriptPromise;
    }

    this.googleScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(
        'google-identity-script'
      ) as HTMLScriptElement | null;

      if (existing) {
        const check = () => {
          const g = (window as any).google;
          if (g && g.accounts && g.accounts.id) {
            resolve();
          } else {
            setTimeout(check, 200);
          }
        };
        check();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        const check = () => {
          const g = (window as any).google;
          if (g && g.accounts && g.accounts.id) {
            resolve();
          } else {
            setTimeout(check, 200);
          }
        };
        check();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services script'));
      };

      document.head.appendChild(script);
    });

    return this.googleScriptPromise;
  }

  private async navigateAfterLogin() {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await this.router.navigate(['/tabs/home'], {
      replaceUrl: true,
      skipLocationChange: false,
    });

    setTimeout(() => {
      const loginPage = document.querySelector('app-login');
      if (loginPage) {
        loginPage.remove();
      }
    }, 300);
  }

  async onRegister(registerForm: NgForm) {
    if (registerForm.invalid) {
      registerForm.form.markAllAsTouched();
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    this.isLoading = true;

    try {
      const res: any = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/api/users/register`,
          this.registerData
        )
      );

      console.log('Registration successful:', res);
      this.isSignUp = false;
      registerForm.resetForm({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gdpr: false,
      });
    } catch (err: any) {
      console.error('Registration failed', err);
      alert(
        err.error?.message ||
          'Registration failed. Please check your data and try again.'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async onLogin(loginForm: NgForm) {
    if (loginForm.invalid) {
      loginForm.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.auth.login(
        this.loginData.username,
        this.loginData.password,
        this.stayLoggedIn
      );

      console.log('Login response:', response);
      await this.navigateAfterLogin();
    } catch (error: any) {
      console.error('Login failed', error);
      alert(
        error.error?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async openGDPR() {
    const modal = await this.modalController.create({
      component: GdprModalComponent,
    });

    document.body.classList.add('modal-open');

    modal.onDidDismiss().then(() => {
      document.body.classList.remove('modal-open');
    });

    await modal.present();
  }

  switchToSignUp() {
    this.isSignUp = true;
    setTimeout(() => this.renderButton(), 0);
  }

  switchToSignIn() {
    this.isSignUp = false;
    setTimeout(() => this.renderButton(), 0);
  }

  renderButton() {
    const g = (window as any).google;
    if (!g || !g.accounts || !g.accounts.id) {
      console.warn('Google Identity Services still not available.');
      return;
    }

    g.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this),
    });

    const signInBtn = document.querySelector('.g_id_signin');
    const signUpBtn = document.querySelector('.g_id_signup');

    if (signInBtn) {
      g.accounts.id.renderButton(signInBtn, {
        theme: 'filled_black',
        size: 'medium',
        shape: 'pill',
      });
    }

    if (signUpBtn) {
      g.accounts.id.renderButton(signUpBtn, {
        theme: 'filled_black',
        size: 'medium',
        shape: 'pill',
      });
    }

    g.accounts.id.prompt();
  }

  async handleCredentialResponse(response: any) {
    console.log('Google JWT ID token: ', response.credential);
    console.log('Google Client ID:', environment.googleClientId);

    this.isLoading = true;

    try {
      const googleResponse: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/users/google-auth`, {
          credential: response.credential,
        })
      );

      await this.auth.loginWithGoogleResponse(
        googleResponse,
        this.stayLoggedIn
      );

      await this.navigateAfterLogin();
    } catch (err: any) {
      console.error('Google sign-in failed', err);
      alert(err.error?.message || 'Google sign-in failed');
    } finally {
      this.isLoading = false;
    }
  }
}
