import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonSpinner } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ModalController,IonicModule } from '@ionic/angular';
import {GdprModalComponent} from './gdpr-modal/gdpr-modal/gdpr-modal.component'

import { AuthService } from '../services/authService';
import { Router } from '@angular/router';

declare const google: any;
export const environment = {
  production: false,
    googleClientId: '413636504400-i4ft6hbngklp9juman43te2vkmouatdg.apps.googleusercontent.com',
    apiUrl: 'http://localhost:3000'

};

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule,IonSpinner , CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

constructor(private http: HttpClient,private authService: AuthService, private router: Router,private modalController: ModalController) {}

isSignUp: boolean = false;


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

async onRegister() {
  
    if (this.registerData.password !== this.registerData.confirmPassword) {
      return alert("Passwords don't match");
    }
    this.isLoading = true;

    try {
      const res: any = await firstValueFrom(
  this.http.post(`${environment.apiUrl}/api/users/register`, this.registerData)
);
      console.log('Registered:', res);
      this.isSignUp = false;
      
    } catch (err) {
      console.error('Registration failed', err);
    }
  }

   async onLogin() {
    if (!this.loginData.username || !this.loginData.password) {
      return alert('Please provide username and password');
    }

    this.isLoading = true;
    
    try {
      await this.authService.login(this.loginData.username, this.loginData.password);
      this.router.navigate(['/tabs/home']);
    } catch (error: any) {
      console.error('Login failed', error);
      alert(error.error?.message || 'Login failed. Please check your credentials.');
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

  ngOnInit() {
    
  }

ngAfterViewInit() {
   this.renderButton();
  }

  switchToSignUp() {
  this.isSignUp = true;
  setTimeout(() => this.renderButton(), 0);
}

switchToSignIn() {
  this.isSignUp = false;
  setTimeout(() => this.renderButton(), 0);
}

async  renderButton(){
 google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this),
    });

    google.accounts.id.renderButton(
      document.querySelector(".g_id_signin"),
      { theme: "filled_black", size: "medium", shape: "pill", }
    );
    google.accounts.id.renderButton(
      document.querySelector(".g_id_signup"),
      { theme: "filled_black", size: "medium", shape: "pill", }
    );

    google.accounts.id.prompt();
  }

 async handleCredentialResponse(response: any) {
    console.log("Google JWT ID token: ", response.credential);
    this.isLoading = true;
    console.log('Google Client ID:', environment.googleClientId);


    this.http.post(`${environment.apiUrl}/api/users/google-auth`, { credential: response.credential })
      .subscribe({
        next: (res: any) => {
          console.log("Google sign-in response", res);
          this.authService.storeToken(res.token);
          this.router.navigate(['/tabs/home']);
        },
        error: (err) => {
          console.error("Google sign-in failed", err);
          alert(err.error?.message || "Google sign-in failed");
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }
}
