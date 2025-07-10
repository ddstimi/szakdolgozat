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
  IonToggle,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeCircle, pencilOutline, checkmarkOutline } from 'ionicons/icons';
type PreferenceType = 'genres' | 'locations' | 'artists' | 'venues';

@Component({
  selector: 'app-edit-preferences-modal',
  templateUrl: './edit-preferences-modal-component.component.html',
  styleUrls: ['./edit-preferences-modal-component.component.scss'],
  standalone: true,
  imports: [
    IonToggle,
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
  @Input() seeCancelled: boolean = false;
  @Input() seeNotAvailable: boolean = false;
  @Input() notifyPush: boolean = false;

  @Input() availableArtists: { id: number; name: string }[] = [];
  @Input() availableLocations: { id: number; name: string }[] = [];
  @Input() availableGenres: { id: number; name: string }[] = [];
  @Input() availableVenues: { id: number; name: string }[] = [];

  @Output() preferencesUpdated = new EventEmitter<{
    genres: string[];
    locations: string[];
    artists: string[];
    venues: string[];
    availableArtists: { id: number; name: string }[];
    availableLocations: { id: number; name: string }[];
    availableGenres: { id: number; name: string }[];
    availableVenues: { id: number; name: string }[];
    seeCancelled: boolean;
    seeNotAvailable: boolean;
    notifyPush: boolean;
  }>();

  selectedGenre = '';
  selectedLocation = '';
  selectedArtist = '';
  selectedVenue = '';

  showCancelled = false;
  showSoldOut = false;

  isEditing = {
    seeCancelled: false,
    seeNotAvailable: false,
    notifyPush: false,
  };

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeCircle, pencilOutline, checkmarkOutline });
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
      availableArtists: this.availableArtists,
      availableGenres: this.availableGenres,
      availableLocations: this.availableLocations,
      availableVenues: this.availableVenues,
      seeCancelled: this.seeCancelled,
      seeNotAvailable: this.seeNotAvailable,
      notifyPush: this.notifyPush,
    });
    this.modalCtrl.dismiss({
      genres: this.genres,
      locations: this.locations,
      artists: this.artists,
      venues: this.venues,
      availableArtists: this.availableArtists,
      availableGenres: this.availableGenres,
      availableLocations: this.availableLocations,
      availableVenues: this.availableVenues,
      seeCancelled: this.seeCancelled,
      seeNotAvailable: this.seeNotAvailable,
      notifyPush: this.notifyPush,
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

  getGenreName(id: number): string {
    if (!this.availableGenres) return 'Loading...';

    const genre = this.availableGenres.find((g) => g.id === id);
    return genre?.name || `Genre ${id}`;
  }

  getArtistName(id: number): string {
    if (!this.availableArtists) return 'Loading...';
    const artist = this.availableArtists.find((a) => a.id === id);
    return artist?.name || `Artist ${id}`;
  }

  getVenueName(id: number): string {
    if (!this.availableVenues) return 'Loading...';
    const venue = this.availableVenues.find((v) => v.id === id);
    return venue?.name || `Venue ${id}`;
  }

  getLocationName(id: number): string {
    if (!this.availableLocations) return 'Loading...';
    const location = this.availableLocations.find((l) => l.id === id);
    return location?.name || `Location ${id}`;
  }
}
