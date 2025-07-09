import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonChip,
  IonIcon,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
type PreferenceType = 'genres' | 'locations' | 'artists' | 'venues';

@Component({
  selector: 'app-edit-preferences-modal',
  templateUrl: './edit-preferences-modal-component.component.html',
  styleUrls: ['./edit-preferences-modal-component.component.scss'],
  standalone: true,
  imports: [
    IonCheckbox,
    IonIcon,
    IonChip,
    IonContent,
    CommonModule,
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
  ],
})
export class EditPreferencesModalComponent {
  @Input() genres: string[] = [];
  @Input() locations: string[] = [];
  @Input() artists: string[] = [];
  @Input() venues: string[] = [];
  @Input() availableGenres: string[] = [];
  @Input() availableLocations: string[] = [];
  @Input() availableArtists: string[] = [];
  @Input() availableVenues: string[] = [];

  @Output() preferencesUpdated = new EventEmitter<{
    genres: string[];
    locations: string[];
    artists: string[];
    venues: string[];
  }>();

  selectedGenre = '';
  selectedLocation = '';
  selectedArtist = '';
  selectedVenue = '';

  showCancelled = false;
  showSoldOut = false;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeCircle });
  }

  closeModal() {
    document.body.classList.remove('modal-open');
    this.modalCtrl.dismiss();
  }

  savePrefs() {
    this.preferencesUpdated.emit({
      genres: this.genres,
      locations: this.locations,
      artists: this.artists,
      venues: this.venues,
    });
    this.modalCtrl.dismiss({
      genres: this.genres,
      locations: this.locations,
      artists: this.artists,
      venues: this.venues,
      showCancelled: this.showCancelled,
      showSoldOut: this.showSoldOut,
    });
  }

  add(type: PreferenceType) {
    const selected = this.getSelectedValue(type);
    const list = this[type];

    if (selected && !list.includes(selected)) {
      list.push(selected);
      this.setSelectedValue(type, '');
    }
  }

  remove(type: PreferenceType, index: number) {
    this[type].splice(index, 1);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getSelectedValue(type: PreferenceType): string {
    switch (type) {
      case 'genres':
        return this.selectedGenre;
      case 'locations':
        return this.selectedLocation;
      case 'artists':
        return this.selectedArtist;
      case 'venues':
        return this.selectedVenue;
      default:
        return '';
    }
  }

  private setSelectedValue(type: PreferenceType, value: string): void {
    switch (type) {
      case 'genres':
        this.selectedGenre = value;
        break;
      case 'locations':
        this.selectedLocation = value;
        break;
      case 'artists':
        this.selectedArtist = value;
        break;
      case 'venues':
        this.selectedVenue = value;
        break;
    }
  }
}
