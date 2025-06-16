import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton, IonInput, IonIcon, IonTextarea, IonCard, IonCheckbox } from '@ionic/angular/standalone';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [HttpClientModule ,IonCheckbox, IonCard, IonTextarea, IonIcon, IonInput, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

constructor(private http: HttpClient) {}

isSignUp: boolean = false;

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


  ngOnInit() {
  }

}
