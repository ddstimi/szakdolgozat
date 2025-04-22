import { Component, OnInit } from '@angular/core';
import {  Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonList } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-edit-user-modal',
  templateUrl: './edit-user-modal-component.component.html',
  styleUrls: ['./edit-user-modal-component.component.scss'],
  imports: [IonList, IonContent,IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonItem, IonLabel, IonInput]})
export class EditUserModalComponent  implements OnInit {

  @Input() isOpen = false;
  @Input() user: { email: string; password: string } = { email: '', password: '' };
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ email: string; password: string }>();
  editedUser = { email: '', password: '' };

  constructor(private modalController: ModalController) {}

  ngOnInit(): void {}

  closeModal() {
    document.body.classList.remove('modal-open');
    this.modalController.dismiss();
  }

}
