import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton, IonInput, IonIcon, IonTextarea, IonCard, IonCheckbox } from '@ionic/angular/standalone';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ModalController,IonicModule } from '@ionic/angular';
import {GdprModalComponent} from './gdpr-modal/gdpr-modal/gdpr-modal.component'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule,HttpClientModule , CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

constructor(private http: HttpClient,private modalController: ModalController) {}

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

}
