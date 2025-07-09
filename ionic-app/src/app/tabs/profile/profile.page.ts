import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem,
  IonButton,
  IonModal,
  IonButtons,
  IonChip,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCard,
  IonList,
} from '@ionic/angular/standalone';
import { EditPreferencesModalComponent } from '../../components/edit-preferences-modal-component/edit-preferences-modal-component.component';
import { EditUserModalComponent } from '../../components/edit-user-modal-component/edit-user-modal-component.component';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/authService';
import { Router } from '@angular/router';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ProfilePage implements OnInit {
  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private router: Router
  ) {}
  predefinedPics: string[] = [
    'http://localhost:3000/profile-pictures/hawer.jpg',
    'http://localhost:3000/profile-pictures/krubi.jpg',
    'http://localhost:3000/profile-pictures/balazs_korda.jpg',
    'http://localhost:3000/profile-pictures/colee.jpg',
    'http://localhost:3000/profile-pictures/desh.jpg',
    'http://localhost:3000/profile-pictures/hofi.jpg',
    'http://localhost:3000/profile-pictures/dzsudlo.jpg',
    'http://localhost:3000/profile-pictures/bikini.jpg',
  ];
  async ngOnInit() {
    try {
      const userData = await this.authService.getUserData();
      this.user.name = userData.name;
      this.user.username = userData.username;
      this.user.email = userData.email;
      this.user.gdpr = userData.gdpr;
      let imgUrl = userData.img_url;
      if (imgUrl) {
        this.user.img_url = imgUrl.includes('http://localhost:3000')
          ? imgUrl
          : 'http://localhost:3000' + imgUrl;
      } else {
        this.user.img_url = 'http://localhost:3000/profile-pictures/bikini.jpg';
      }
      await this.loadPreferences();
      console.log(this.user.img_url);
    } catch (error) {
      console.error('Could not load user data', error);
    }
  }
  async loadPreferences() {
    try {
      const preferences = await this.authService.getPreferences();

      // Update your component state with the loaded preferences
      this.genres = preferences.genres || [];
      this.locations = preferences.locations || [];
      this.artists = preferences.artists || [];
      this.venues = preferences.venues || [];

      this.seeCancelled = preferences.see_cancelled;
      this.seeNotAvailable = preferences.see_not_available;
      this.notifyPush = preferences.notify_push;
    } catch (error) {
      console.error('Failed to load preferences', error);
    }
  }
  get isModalOpen(): boolean {
    return this.showUserModal || this.showPrefModal;
  }

  showUserModal = false;
  showPrefModal = false;

  user = {
    name: '',
    email: '',
    password: '********',
    username: '',
    gdpr: false,
    img_url: '',
  };

  // Selection arrays (store IDs only)
  artists: number[] = [];
  locations: number[] = [];
  genres: number[] = [];
  venues: number[] = [];
  seeCancelled: boolean = false;
  seeNotAvailable: boolean = false;
  notifyPush: boolean = false;

  // Selected items (store IDs only)
  selectedGenre: number | null = null;
  selectedLocation: number | null = null;
  selectedArtist: number | null = null;
  selectedVenue: number | null = null;

  // Filtered options (full objects for display)
  filteredGenres: { id: number; name: string }[] = [];
  filteredLocations: { id: number; name: string }[] = [];
  filteredArtists: { id: number; name: string }[] = [];
  filteredVenues: { id: number; name: string }[] = [];

  // Available options (full objects)
  availableArtists: { id: number; name: string }[] = [
    { id: 1, name: 'Arctic Monkeys' },
    { id: 2, name: 'Billie Eilish' },
    { id: 3, name: 'Krúbi' },
  ];

  availableLocations: { id: number; name: string }[] = [
    { id: 1, name: 'Budapest - Akvárium' },
    { id: 2, name: 'Pécs - Nappali' },
  ];

  availableGenres: { id: number; name: string }[] = [
    { id: 1, name: 'Rock' },
    { id: 2, name: 'Jazz' },
    { id: 3, name: 'Indie' },
  ];

  availableVenues: { id: number; name: string }[] = [
    { id: 1, name: 'Jate' },
    { id: 2, name: 'Hungi' },
    { id: 3, name: 'Ápoló' },
  ];

  async savePreferences() {
    try {
      const prefs = {
        see_cancelled: false, // Set these based on your UI toggles
        see_not_available: false,
        notify_push: false,
        artists: this.artists,
        locations: this.locations,
        genres: this.genres,
        venues: this.venues,
      };

      const response = await this.authService.updatePreferences(prefs);
      console.log('Preferences updated successfully', response);

      // Optional: Show success message to user
      // this.showToast('Preferences saved!');
    } catch (error) {
      console.error('Failed to save preferences', error);
      // Optional: Show error message to user
      // this.showToast('Failed to save preferences', 'danger');
    }
  }

  newGenre = '';
  newLocation = '';
  newArtist = '';

  selectedPicture = '';

  async selectPreset(img: string) {
    this.selectedPicture = img;
    console.log('Preset selected:', img);
    try {
      await this.updateProfilePicture();
      console.log('Profile picture updated from preset.');
    } catch (error) {
      console.error('Failed to update profile picture from preset', error);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.readImage(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.readImage(file);
      try {
        const response = await this.authService.uploadImage(file);
        this.user.img_url = response.user.img_url;
        this.selectedPicture = response.user.img_url;
        // Show success message to user
      } catch (error) {
        console.error('Upload error:', error);
        // Show error message to user
      }
    }
  }

  readImage(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      this.selectedPicture = reader.result as string;
      try {
        await this.authService.uploadImage(file);
        console.log('Profile picture updated successfully.');
      } catch (error) {
        console.error('Failed to update profile picture', error);
      }
    };
    reader.readAsDataURL(file);
  }

  async updateProfilePicture() {
    try {
      const response = await this.authService.updateUserProfilePicture(
        this.selectedPicture
      );

      if (response.user) {
        this.user.img_url = response.user.img_url;

        this.authService.storeToken(response.token);
      }
    } catch (error) {
      console.error('Failed to update profile picture', error);
    }
  }

  onGenreInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredGenres = query
      ? this.availableGenres.filter((opt) =>
          opt.name.toLowerCase().includes(query)
        )
      : [];
  }

  selectGenre(genre: { id: number; name: string }) {
    this.selectedGenre = genre.id;
    this.filteredGenres = [];
  }

  addGenre() {
    if (
      this.selectedGenre !== null &&
      !this.genres.includes(this.selectedGenre)
    ) {
      this.genres.push(this.selectedGenre);
      this.selectedGenre = null;
    }
  }

  onLocationInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredLocations = query
      ? this.availableLocations.filter((opt) =>
          opt.name.toLowerCase().includes(query)
        )
      : [];
  }

  selectLocation(location: { id: number; name: string }) {
    this.selectedLocation = location.id;
    this.filteredLocations = [];
  }

  addLocation() {
    if (
      this.selectedLocation !== null &&
      !this.locations.includes(this.selectedLocation)
    ) {
      this.locations.push(this.selectedLocation);
      this.selectedLocation = null;
    }
  }

  onArtistInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredArtists = query
      ? this.availableArtists.filter((opt) =>
          opt.name.toLowerCase().includes(query)
        )
      : [];
  }

  selectArtist(artist: { id: number; name: string }) {
    this.selectedArtist = artist.id;
    this.filteredArtists = [];
  }

  addArtist() {
    if (
      this.selectedArtist !== null &&
      !this.artists.includes(this.selectedArtist)
    ) {
      this.artists.push(this.selectedArtist);
      this.selectedArtist = null;
    }
  }

  onVenueInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredVenues = query
      ? this.availableVenues.filter((opt) =>
          opt.name.toLowerCase().includes(query)
        )
      : [];
  }

  selectVenue(venue: { id: number; name: string }) {
    this.selectedVenue = venue.id;
    this.filteredVenues = [];
  }

  addVenue() {
    if (
      this.selectedVenue !== null &&
      !this.venues.includes(this.selectedVenue)
    ) {
      this.venues.push(this.selectedVenue);
      this.selectedVenue = null;
    }
  }

  async openEditUser() {
    const modal = await this.modalCtrl.create({
      component: EditUserModalComponent,
      componentProps: { user: this.user },
    });
    document.body.classList.add('modal-open');
    modal.onDidDismiss().then(() => {
      document.body.classList.remove('modal-open');
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      this.saveUser(data);
    }
  }

  async openEditPreferences() {
    const modal = await this.modalCtrl.create({
      component: EditPreferencesModalComponent,
      componentProps: {
        genres: [...this.genres],
        locations: [...this.locations],
        artists: [...this.artists],
        availableGenres: this.availableGenres,
        availableLocations: this.availableLocations,
        availableArtists: this.availableArtists,
      },
    });
    document.body.classList.add('modal-open');

    modal.onDidDismiss().then(({ data }) => {
      if (data) {
        this.genres = data.genres || this.genres;
        this.locations = data.locations || this.locations;
        this.artists = data.artists || this.artists;
        document.body.classList.remove('modal-open');
        this.savePreferences();
      }
    });

    await modal.present();
  }

  closePrefModal() {
    document.body.classList.remove('modal-open');
    this.showPrefModal = false;
    this.modalCtrl.dismiss();
  }

  updatePreferences(event: any) {
    console.log('Updated preferences:', event);
    this.genres = event.genres;
    this.locations = event.locations;
    this.artists = event.artists;
  }

  // Helper methods to get names from IDs
  getGenreName(id: number): string {
    const genre = this.availableGenres.find((g) => g.id === id);
    return genre ? genre.name : 'Unknown Genre';
  }

  getArtistName(id: number): string {
    const artist = this.availableArtists.find((a) => a.id === id);
    return artist ? artist.name : 'Unknown Artist';
  }

  getLocationName(id: number): string {
    const location = this.availableLocations.find((l) => l.id === id);
    return location ? location.name : 'Unknown Location';
  }

  getVenueName(id: number): string {
    const venue = this.availableVenues.find((v) => v.id === id);
    return venue ? venue.name : 'Unknown Venue';
  }

  // Removal methods
  removeGenre(id: number) {
    this.genres = this.genres.filter((g) => g !== id);
    this.savePreferences(); // Auto-save changes
  }

  removeArtist(id: number) {
    this.artists = this.artists.filter((a) => a !== id);
    this.savePreferences();
  }

  removeLocation(id: number) {
    this.locations = this.locations.filter((l) => l !== id);
    this.savePreferences();
  }

  removeVenue(id: number) {
    this.venues = this.venues.filter((v) => v !== id);
    this.savePreferences();
  }

  async saveUser(updatedUser: {
    name: string;
    email: string;
    password: string;
    username: string;
    gdpr: boolean;
    img_url: string;
  }) {
    this.user = { ...updatedUser };

    try {
      await this.authService.updateUserData(this.user);
      // Optional: show success toast
    } catch (err) {
      console.error('Error updating user', err);
      // Optional: show error toast
    }

    this.showUserModal = false;
  }

  notifications = [
    {
      title: 'New Concert Nearby!',
      message:
        'A new concert matching your preferences is available in Budapest.',
      timeAgo: '2h ago',
      read: false,
    },
    {
      title: 'Ticket Price Drop!',
      message: 'Prices dropped for Arctic Monkeys tickets!',
      timeAgo: '1 day ago',
      read: false,
    },
    {
      title: 'New Artist in Your Favorites',
      message: 'Billie Eilish has a new event in your region.',
      timeAgo: '3 days ago',
      read: false,
    },
  ];

  unreadCount = this.notifications.filter((n) => !n.read).length;

  openNotificationsPage() {
    this.router.navigate(['/tabs/profile/notifications']);
  }

  onLogout() {
    this.authService.logout();
  }
}
