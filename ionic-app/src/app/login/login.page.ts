import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton, IonInput, IonIcon, IonTextarea, IonCard, IonCheckbox, IonSpinner } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/authService';
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonSpinner ,IonCheckbox, IonCard, IonTextarea, IonIcon, IonInput, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

constructor(private http: HttpClient,private authService: AuthService, private router: Router) {}

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

  ngOnInit() {
  }

}
