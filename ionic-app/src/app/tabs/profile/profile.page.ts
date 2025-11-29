import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditPreferencesModalComponent } from '../../components/edit-preferences-modal-component/edit-preferences-modal-component.component';
import { EditUserModalComponent } from '../../components/edit-user-modal-component/edit-user-modal-component.component';
import { ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { PushService } from 'src/app/services/push.service';
import { UserPreferencesService } from 'src/app/services/user-preferences.service';
import { NotificationsClientService } from 'src/app/services/notification.service';

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
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private pushService: PushService,
    private prefsService: UserPreferencesService,
    private notificationsClient: NotificationsClientService
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
  seeCancelled = false;
  seeNotAvailable = false;
  notifyPush = false;

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

  notifications: Array<{
    id: number;
    title: string;
    message: string;
    timeAgo: string;
    read: boolean;
  }> = [];
  unreadCount = 0;

  showUserModal = false;
  showPrefModal = false;

  newGenre = '';
  newLocation = '';
  newArtist = '';

  selectedPicture = '';
  isUploading = false;
  uploadPct = 0;

  get isModalOpen(): boolean {
    return this.showUserModal || this.showPrefModal;
  }

  async ngOnInit() {
    await this.refreshNotificationsPreview();
    this.cdr.detectChanges();
    window.dispatchEvent(new CustomEvent('notif:changed'));

    let token = this.auth.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const newToken = await this.auth.refreshAccessToken();
    if (!newToken) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const userData = await this.auth.getUserData();
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
        this.prefsService.getPreferenceOptions(),
        this.prefsService.getPreferences(),
      ]);

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
      const response = await this.prefsService.getPreferences();

      this.genres = response.genres || [];
      this.artists = response.artists || [];
      this.venues = response.venues || [];
      this.locations = response.cities || [];
      this.seeCancelled = Boolean(response.preferences?.see_cancelled);
      this.seeNotAvailable = Boolean(response.preferences?.see_not_available);
      this.notifyPush = Boolean(response.preferences?.notify_push);

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

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

      const response = await this.prefsService.updatePreferences(prefs);

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
      const { user, publicUrl } = await this.auth.uploadAvatarToR2(
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
      const user = await this.auth.updateUserProfilePicture(img, true);
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

  async updateProfilePicture() {
    try {
      const user = await this.auth.updateUserProfilePicture(
        this.selectedPicture,
        true
      );
      if (user?.img_url) {
        this.user.img_url = user.img_url;
        this.selectedPicture = user.img_url;
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
        try {
          if (this.notifyPush) {
            await this.pushService.enablePushNotifications();
          } else {
            await this.pushService.disablePushNotifications();
          }
        } catch (e) {
          console.error('Push toggle error', e);
        }
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
    this.genres = event.genres;
    this.locations = event.locations;
    this.artists = event.artists;
    this.cdr.detectChanges();

    await this.loadPreferences();
  }

  getGenreName(id: number): string {
    const genre = this.availableGenres.find((g) => g.id === id);
    return genre?.name || `Genre ${id}`;
  }

  getArtistName(id: number): string {
    const artist = this.availableArtists.find((a) => a.id === id);
    return artist?.name || `Artist ${id}`;
  }

  getVenueName(id: number): string {
    const venue = this.availableVenues.find((v) => v.id === id);
    return venue?.name || `Venue ${id}`;
  }

  getLocationName(id: number): string {
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
      await this.auth.updateUserData(payload, true);
    } catch (err) {
      console.error('Error updating user', err);
    }

    this.showUserModal = false;
  }

  private toTimeAgo(iso: string): string {
    const t = new Date(iso).getTime();
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  private async refreshNotificationsPreview() {
    try {
      const rows = await this.notificationsClient.getNotifications(false);
      const list = rows.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        timeAgo: this.toTimeAgo(n.sent_date),
        read: !!n.is_read,
      }));
      this.notifications = list.slice(0, 3);
      this.unreadCount = list.filter((n) => !n.read).length;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }

  ionViewWillEnter() {
    this.cdr.detectChanges();
    this.refreshNotificationsPreview();
  }

  openNotificationsPage() {
    this.router.navigate(['/tabs/profile/notifications']);
  }

  async onLogout() {
    this.auth.logout();
    this.router.navigate(['/login'], {
      state: { fromLogout: true },
    });
  }
}
