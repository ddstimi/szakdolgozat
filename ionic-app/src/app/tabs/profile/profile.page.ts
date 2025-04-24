import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonItem, IonButton, IonModal, IonButtons, IonChip, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonList } from '@ionic/angular/standalone';
import { EditPreferencesModalComponent } from "../../components/edit-preferences-modal-component/edit-preferences-modal-component.component";
import { EditUserModalComponent } from "../../components/edit-user-modal-component/edit-user-modal-component.component";
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [EditUserModalComponent,EditPreferencesModalComponent,IonicModule, CommonModule, FormsModule],

})
export class ProfilePage implements OnInit {

  filteredGenres: string[] = [];
  filteredLocations: string[] = [];
  filteredArtists: string[] = [];
  

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
  }

  get isModalOpen(): boolean {
    return this.showUserModal || this.showPrefModal;
  }

  showUserModal = false;
  showPrefModal = false;

  user = {
    email: 'user@example.com',
    password: '********',
    username: 'user.name'
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

  async openEditUser() {
    const modal = await this.modalCtrl.create({
      component: EditUserModalComponent,
      componentProps: {
        user: this.user
      }
    });
  
    // Add a class to blur the background content
    document.body.classList.add('modal-open');
  
    modal.onDidDismiss().then(({ data }) => {
      if (data) {
        this.saveUser(data);
      }
      
      // Remove the blur class when the modal is closed
      document.body.classList.remove('modal-open');
    });
  
    await modal.present();
  }
  
  

  async openEditPreferences() {
    const modal = await this.modalCtrl.create({
      component: EditPreferencesModalComponent,
      componentProps: {
        genres: this.genres,
        locations: this.locations,
        artists: this.artists,
        availableGenres: this.availableGenres,
        availableLocations: this.availableLocations,
        availableArtists: this.availableArtists
      }
    });
  
    // Add a class to blur the background content
    document.body.classList.add('modal-open');
  
    modal.onDidDismiss().then(() => {
      // Remove the blur class when the modal is closed
      document.body.classList.remove('modal-open');
    });
  
    await modal.present();
  }
  


  

  closePrefModal() {
    document.body.classList.remove('modal-open');
    this.showPrefModal = false;
    this.modalCtrl.dismiss();
  }

  // Handle the update event from the modal
  updatePreferences(event: any) {
    console.log('Updated preferences:', event);
    this.genres = event.genres;
    this.locations = event.locations;
    this.artists = event.artists;
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
  
  saveUser(updatedUser: { email: string; password: string , username: string}) {
    this.user = updatedUser;
    this.showUserModal = false;
  }
  

  

// TODO: fixing the bug when reloading and navigate from home page the profile page is bugging
  
}
