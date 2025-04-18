import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonItem, IonButton, IonModal, IonButtons, IonChip, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonList, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonChip, IonButtons, IonModal, IonButton, IonItem, IonLabel, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {

  filteredGenres: string[] = [];
  filteredLocations: string[] = [];
  filteredArtists: string[] = [];
  

  constructor() { }

  ngOnInit() {
  }
  showUserModal = false;
  showPrefModal = false;

  user = {
    email: 'user@example.com',
    password: '********'
  };

  genres = ['Rock', 'Jazz', 'Indie'];
  locations = ['Budapest - Akvárium', 'Pécs - Nappali'];
  artists = ['Arctic Monkeys', 'Billie Eilish'];

  availableGenres: string[] = ['Rock', 'Jazz', 'Pop', 'Indie', 'Hip-hop', 'Heavy metal'];
  availableLocations: string[] = ['Budapest - Akvárium', 'Pécs - Nappali'];
  availableArtists: string[] = ['Arctic Monkeys', 'Billie Eilish', 'Krúbi'];

  selectedGenre = '';
  selectedLocation = '';
  selectedArtist = '';

  newGenre = '';
  newLocation = '';
  newArtist = '';

  openEditUser() {
    this.showUserModal = true;
  }

  openEditPreferences() {
    this.showPrefModal = true;
  }

  saveUser() {
    this.showUserModal = false;
  }

  filterOptions(query: string, options: string[]): string[] {
    const q = query.toLowerCase();
    return options.filter(
      (opt) => opt.toLowerCase().includes(q) && !this.genres.includes(opt) && !this.locations.includes(opt) && !this.artists.includes(opt)
    );
  }

  addGenre() {
    if (this.selectedGenre && this.availableGenres.includes(this.selectedGenre) && !this.genres.includes(this.selectedGenre)) {
      this.genres.push(this.selectedGenre);
    }
    this.selectedGenre = '';
  }

  addLocation() {
    if (this.selectedLocation && this.availableLocations.includes(this.selectedLocation) && !this.locations.includes(this.selectedLocation)) {
      this.locations.push(this.selectedLocation);
    }
    this.selectedLocation = '';
  }

  addArtist() {
    if (this.selectedArtist && this.availableArtists.includes(this.selectedArtist) && !this.artists.includes(this.selectedArtist)) {
      this.artists.push(this.selectedArtist);
    }
    this.selectedArtist = '';
  }

  removeGenre(index: number) {
    this.genres.splice(index, 1);
  }

  removeLocation(index: number) {
    this.locations.splice(index, 1);
  }

  removeArtist(index: number) {
    this.artists.splice(index, 1);
  }

  onGenreInput(event: any) {
    const query = event.target.value;
    this.filteredGenres = query
      ? this.availableGenres.filter(opt =>
          opt.toLowerCase().includes(query.toLowerCase()) &&
          !this.genres.includes(opt)
        )
      : [];
  }
  
  selectGenre(option: string) {
    this.selectedGenre = option;
    this.filteredGenres = [];
  }
  
  onLocationInput(event: any) {
    const query = event.target.value;
    this.filteredLocations = query
      ? this.availableLocations.filter(opt =>
          opt.toLowerCase().includes(query.toLowerCase()) &&
          !this.locations.includes(opt)
        )
      : [];
  }
  
  selectLocation(option: string) {
    this.selectedLocation = option;
    this.filteredLocations = [];
  }
  
  onArtistInput(event: any) {
    const query = event.target.value;
    this.filteredArtists = query
      ? this.availableArtists.filter(opt =>
          opt.toLowerCase().includes(query.toLowerCase()) &&
          !this.artists.includes(opt)
        )
      : [];
  }
  
  selectArtist(option: string) {
    this.selectedArtist = option;
    this.filteredArtists = [];
  }
  
  
}
