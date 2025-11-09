import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditPreferencesModalComponent } from '../../components/edit-preferences-modal-component/edit-preferences-modal-component.component';
import { EditUserModalComponent } from '../../components/edit-user-modal-component/edit-user-modal-component.component';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { frontendService } from 'src/app/services/frontendService';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
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
    private frontendService: frontendService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  predefinedPics: string[] = [
    environment.apiUrl + '/profile-pictures/hawer.jpg',
    environment.apiUrl + '/profile-pictures/krubi.jpg',
    environment.apiUrl + '/profile-pictures/balazs_korda.jpg',
    environment.apiUrl + '/profile-pictures/colee.jpg',
    environment.apiUrl + '/profile-pictures/desh.jpg',
    environment.apiUrl + '/profile-pictures/hofi.jpg',
    environment.apiUrl + '/profile-pictures/dzsudlo.jpg',
    environment.apiUrl + '/profile-pictures/bikini.jpg',
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

  user = {
    name: '',
    email: '',
    password: '********',
    username: '',
    gdpr: false,
    img_url: '',
  };

  async ngOnInit() {
    let token = this.frontendService.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const newToken = await this.frontendService.refreshAccessToken();
    if (!newToken) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const userData = await this.frontendService.getUserData();
      this.user = {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        gdpr: userData.gdpr,
        password: '********',
        img_url: userData.img_url,
      };
      this.selectedPicture = this.user.img_url;
      await this.loadPreferences();
      const [optionsResponse, preferencesResponse] = await Promise.all([
        this.frontendService.getPreferenceOptions(),
        this.frontendService.getPreferences(),
      ]);

      console.log('Options API Response:', optionsResponse);
      this.availableGenres = optionsResponse.genres;
      this.availableArtists = optionsResponse.artists;
      this.availableVenues = optionsResponse.venues;
      this.availableLocations = optionsResponse.cities;

      this.genres = preferencesResponse.genres || [];
      this.artists = preferencesResponse.artists || [];
      this.venues = preferencesResponse.venues || [];
      this.locations = preferencesResponse.cities || [];

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  async loadPreferences() {
    try {
      const response = await this.frontendService.getPreferences();
      console.log('Full preferences response:', response);

      this.genres = response.genres || [];
      this.artists = response.artists || [];
      this.venues = response.venues || [];
      this.locations = response.cities || [];
      this.seeCancelled = Boolean(response.preferences?.see_cancelled);
      this.seeNotAvailable = Boolean(response.preferences?.see_not_available);
      this.notifyPush = Boolean(response.preferences?.notify_push);

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

  async savePreferences() {
    try {
      const prefs = {
        see_cancelled: this.seeCancelled,
        see_not_available: this.seeNotAvailable,
        notify_push: this.notifyPush,
        artists: this.artists,
        locations: this.locations,
        genres: this.genres,
        venues: this.venues,
      };

      console.log('Saving preferences:', prefs);

      const response = await this.frontendService.updatePreferences(prefs);
      console.log('Save response:', response);

      if (response?.data) {
        this.seeCancelled = Boolean(response.data.see_cancelled);
        this.seeNotAvailable = Boolean(response.data.see_not_available);
        this.notifyPush = Boolean(response.data.notify_push);
      }

      this.showPrefModal = false;
    } catch (error) {
      console.error('Save failed:', error);
    }
    this.cdr.detectChanges();

    await this.loadPreferences();
  }
  newGenre = '';
  newLocation = '';
  newArtist = '';

  selectedPicture = '';

  private preview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedPicture = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onFileSelected(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (file) this.startAvatarUpload(file);
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.startAvatarUpload(file);
  }
  isUploading = false;
  uploadPct = 0;

  private async startAvatarUpload(file: File) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type. Only JPEG/PNG allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large (max 5MB)');
      return;
    }

    this.preview(file);

    this.isUploading = true;
    this.uploadPct = 0;
    this.cdr.detectChanges();

    try {
      const { user, publicUrl } = await this.frontendService.uploadAvatarToR2(
        file,
        true,
        (pct) => {
          this.uploadPct = pct;
          this.cdr.detectChanges();
        }
      );

      if (user?.img_url) {
        this.user.img_url = user.img_url;
        this.selectedPicture = user.img_url;
      } else if (publicUrl) {
        this.user.img_url = publicUrl;
        this.selectedPicture = publicUrl;
      }

      this.cdr.detectChanges();
      console.log('Profile picture updated ✔️');
    } catch (err) {
      console.error('Upload error', err);
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  async selectPreset(img: string) {
    this.selectedPicture = img;
    try {
      const user = await this.frontendService.updateUserProfilePicture(
        img,
        true
      );
      if (user?.img_url) {
        this.user.img_url = user.img_url;
        this.selectedPicture = user.img_url;
      }
    } catch (err) {
      console.error('Failed to update profile picture from preset', err);
    } finally {
      this.cdr.detectChanges();
    }
  }

  present(img: string) {
    this.selectPreset(img);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  readImage(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      this.selectedPicture = reader.result as string;
      try {
        console.log('Profile picture updated successfully.');
      } catch (error) {
        console.error('Failed to update profile picture', error);
      }
    };
    reader.readAsDataURL(file);
  }

  async updateProfilePicture() {
    try {
      const response = await this.frontendService.updateUserProfilePicture(
        this.selectedPicture,
        true
      );

      if (response.user) {
        this.user.img_url = response.user.img_url;

        this.frontendService.storeToken(response.token);
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
        venues: [...this.venues],
        availableGenres: this.availableGenres,
        availableLocations: this.availableLocations,
        availableArtists: this.availableArtists,
        availableVenues: this.availableVenues,
        seeCancelled: this.seeCancelled,
        seeNotAvailable: this.seeNotAvailable,
        notifyPush: this.notifyPush,
      },
    });
    document.body.classList.add('modal-open');

    modal.onDidDismiss().then(async ({ data }) => {
      if (data) {
        this.genres = data.genres || [];
        this.locations = data.locations || [];
        this.artists = data.artists || [];
        this.venues = data.venues || [];
        this.seeCancelled = Boolean(data.seeCancelled);
        this.seeNotAvailable = Boolean(data.seeNotAvailable);
        this.notifyPush = Boolean(data.notifyPush);

        await this.savePreferences();
      }
    });

    await modal.present();
  }
  closePrefModal() {
    document.body.classList.remove('modal-open');
    this.showPrefModal = false;

    this.modalCtrl.dismiss();
  }

  async updatePreferences(event: any) {
    console.log('Updated preferences:', event);
    this.genres = event.genres;
    this.locations = event.locations;
    this.artists = event.artists;
    this.cdr.detectChanges();

    await this.loadPreferences();
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
    username: string;
    gdpr: boolean;
    password?: string;
    img_url?: string;
  }) {
    this.user = { ...this.user, ...updatedUser };

    const payload: {
      name: string;
      email: string;
      username: string;
      gdpr: boolean;
      password?: string;
      img_url?: string;
    } = {
      name: this.user.name ?? '',
      email: this.user.email ?? '',
      username: this.user.username ?? '',
      gdpr: this.user.gdpr ?? false,
      img_url: this.user.img_url ?? '',
    };

    const pwd = (updatedUser.password ?? '').trim();
    if (pwd && pwd !== '********') {
      payload.password = pwd;
    }

    try {
      await this.frontendService.updateUserData(payload, true);
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

  async onLogout() {
    await this.frontendService.logout();
    this.router.navigate(['/login'], {
      state: { fromLogout: true },
    });
  }
}
