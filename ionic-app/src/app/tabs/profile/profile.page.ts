import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditPreferencesModalComponent } from '../../components/edit-preferences-modal-component/edit-preferences-modal-component.component';
import { EditUserModalComponent } from '../../components/edit-user-modal-component/edit-user-modal-component.component';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/authService';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
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
    private router: Router,
    private cdr: ChangeDetectorRef
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

  artists: number[] = [];
  locations: number[] = [];
  genres: number[] = [];
  venues: number[] = [];
  seeCancelled: boolean = false;
  seeNotAvailable: boolean = false;
  notifyPush: boolean = false;

  selectedGenre: number | null = null;
  selectedLocation: number | null = null;
  selectedArtist: number | null = null;
  selectedVenue: number | null = null;

  filteredGenres: { id: number; name: string }[] = [];
  filteredLocations: { id: number; name: string }[] = [];
  filteredArtists: { id: number; name: string }[] = [];
  filteredVenues: { id: number; name: string }[] = [];

  availableArtists: { id: number; name: string }[] = [];
  availableLocations: { id: number; name: string }[] = [];
  availableGenres: { id: number; name: string }[] = [];
  availableVenues: { id: number; name: string }[] = [];

  async ngOnInit() {
    try {
      const userData = await this.authService.getUserData();
      this.user = {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        gdpr: userData.gdpr,
        password: userData.password,
        img_url: userData.img_url?.includes('http://localhost:3000')
          ? userData.img_url
          : 'http://localhost:3000' +
            (userData.img_url || '/profile-pictures/bikini.jpg'),
      };
      this.selectedPicture = this.user.img_url;

      const optionsResponse = await this.authService.getPreferenceOptions();
      console.log('Options API Response:', optionsResponse);
      this.availableGenres = optionsResponse.genres;
      this.availableArtists = optionsResponse.artists;
      this.availableVenues = optionsResponse.venues;
      this.availableLocations = optionsResponse.cities;

      console.log('Available options loaded:', {
        genres: this.availableGenres,
        artists: this.availableArtists,
        venues: this.availableVenues,
        locations: this.availableLocations,
      });

      await this.loadPreferences();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  async loadPreferences() {
    try {
      const response = await this.authService.getPreferences();
      console.log('Full preferences response:', response);

      this.genres = response.genres || [];
      this.artists = response.artists || [];
      this.venues = response.venues || [];
      this.locations = response.cities || [];

      console.log('Preferences loaded with available data:', {
        genreIds: this.genres,
        availableGenres: this.availableGenres,
      });

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading preferences:', error);
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

  async savePreferences() {
    try {
      const prefs = {
        see_cancelled: false,
        see_not_available: false,
        notify_push: false,
        artists: this.artists,
        locations: this.locations,
        genres: this.genres,
        venues: this.venues,
      };

      const response = await this.authService.updatePreferences(prefs);
      console.log('Preferences updated successfully', response);
    } catch (error) {
      console.error('Failed to save preferences', error);
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
      } catch (error) {
        console.error('Upload error:', error);
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
  removeGenre(id: number) {
    this.genres = this.genres.filter((g) => g !== id);
    this.savePreferences();
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
    } catch (err) {
      console.error('Error updating user', err);
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
