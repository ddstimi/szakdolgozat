import { Component, OnInit } from '@angular/core';
import { IonList, IonItem, IonLabel, IonInput, IonButton, IonHeader, IonToolbar, IonContent, IonTitle, IonModal } from "@ionic/angular/standalone";
import { ModalController } from '@ionic/angular';


@Component({
  selector: 'app-gdpr-modal',
  templateUrl: './gdpr-modal.component.html',
  styleUrls: ['./gdpr-modal.component.scss'],
  standalone: true,
  imports: [IonModal, IonTitle, IonContent,  IonButton, IonHeader, IonToolbar]
})
export class GdprModalComponent  implements OnInit {

  constructor(private modalController: ModalController) { }

    closeModal() {
    this.modalController.dismiss();
  }
  ngOnInit() {}

}
