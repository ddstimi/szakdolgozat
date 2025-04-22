import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonItem, IonLabel, IonInput, IonList, IonChip, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-preferences-modal',
  templateUrl: './edit-preferences-modal-component.component.html',
  standalone: true,
  imports: [IonIcon, IonChip,IonContent, CommonModule, FormsModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonItem, IonLabel, IonInput, IonList]})
  export class EditPreferencesModalComponent {
    [key: string]: any;
    @Input() genres: string[] = [];
    @Input() locations: string[] = [];
    @Input() artists: string[] = [];
    @Input() availableGenres: string[] = [];
    @Input() availableLocations: string[] = [];
    @Input() availableArtists: string[] = [];
  
    @Output() close = new EventEmitter<void>();
    @Output() update = new EventEmitter<{ genres: string[]; locations: string[]; artists: string[] }>();
  
    selectedGenre = '';
    selectedLocation = '';
    selectedArtist = '';
  
    filteredGenres: string[] = [];
    filteredLocations: string[] = [];
    filteredArtists: string[] = [];
  
    constructor(private modalCtrl: ModalController) {}
  

    closeModal() {
      document.body.classList.remove('modal-open');
      this.modalCtrl.dismiss();
    }
  
    onSearch(query: string, list: string[], existing: string[]): string[] {
      const lower = query.toLowerCase();
      return list.filter(opt => opt.toLowerCase().includes(lower) && !existing.includes(opt));
    }
  
    onGenreInput(event: any) {
      this.filteredGenres = this.onSearch(event.target.value, this.availableGenres, this.genres);
    }
  
    onLocationInput(event: any) {
      this.filteredLocations = this.onSearch(event.target.value, this.availableLocations, this.locations);
    }
  
    onArtistInput(event: any) {
      this.filteredArtists = this.onSearch(event.target.value, this.availableArtists, this.artists);
    }
  
    add(type: 'genre' | 'location' | 'artist') {
      const selected = this[`selected${this.capitalize(type)}`];
      const list = this[type + 's'];
      if (selected && !list.includes(selected)) {
        list.push(selected);
        this[`selected${this.capitalize(type)}`] = '';
        this[`filtered${this.capitalize(type)}s`] = [];
      }
    }
  
    remove(type: 'genre' | 'location' | 'artist', index: number) {
      this[type + 's'].splice(index, 1);
    }
  
    savePrefs() {
      this.update.emit({
        genres: this.genres,
        locations: this.locations,
        artists: this.artists,
      });
      this.close.emit();
    }
  
    capitalize(word: string) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }