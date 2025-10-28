import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonIcon,
  IonCheckbox,
  IonToggle,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-user-modal',
  templateUrl: './edit-user-modal-component.component.html',
  styleUrls: ['./edit-user-modal-component.component.scss'],
  standalone: true,
  imports: [
    IonToggle,
    IonIcon,
    IonList,
    IonContent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonCheckbox,
    FormsModule,
    CommonModule,
  ],
})
export class EditUserModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() user: {
    name: string;
    email: string;
    password?: string;
    username: string;
    gdpr: boolean;
  } = { name: '', email: '', password: '', username: '', gdpr: false };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    name: string;
    email: string;
    password?: string;
    username: string;
    gdpr: boolean;
  }>();

  editedUser = { ...this.user };

  isEditingUsername = false;
  isEditingName = false;
  isEditingEmail = false;
  isEditingPassword = false;
  isEditingGDPR = false;

  constructor(private modalController: ModalController) {}

  ngOnInit(): void {
    this.editedUser = { ...this.user };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && changes['user'].currentValue) {
      this.editedUser = { ...changes['user'].currentValue };
    }
  }

  closeModal() {
    document.body.classList.remove('modal-open');
    this.modalController.dismiss();
    this.close.emit();
  }

  isEditing = {
    name: false,
    username: false,
    email: false,
    password: false,
    gdpr: false,
  };

  saveUserField(field: keyof typeof this.editedUser) {
    this.isEditing[field] = false;
    console.log(field);
    console.log(this.isEditing[field]);
  }

  async saveChanges() {
    const updatedUser = { ...this.editedUser };

    const pwd = (updatedUser.password ?? '').trim();

    if (!pwd || pwd === '********' || pwd === this.user.password) {
      delete updatedUser.password;
    } else {
      updatedUser.password = pwd;
    }

    await this.modalController.dismiss(updatedUser);
  }
}

function fieldEditFlag(field: string) {
  switch (field) {
    case 'name':
      return 'isEditingName';
    case 'email':
      return 'isEditingEmail';
    case 'password':
      return 'isEditingPassword';
    case 'username':
      return 'isEditingUsername';
    case 'gdpr':
      return 'isEditingGDPR';
    default:
      return '';
  }
}
