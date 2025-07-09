import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    EditUserModalComponent,
    EditPreferencesModalComponent,
    IonicModule,
    CommonModule,
    FormsModule,
  ],
})
export class ProfilePage implements OnInit {
  filteredGenres: string[] = [];
  filteredLocations: string[] = [];
  filteredArtists: string[] = [];

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  predefinedPics: string[] = [
    'assets/images/prof_pic/hawer.jpg',
    'assets/images/prof_pic/krubi.jpg',
    'assets/images/prof_pic/balazs_korda.jpg',
    'assets/images/prof_pic/colee.jpg',
    'assets/images/prof_pic/desh.jpg',
    'assets/images/prof_pic/hofi.jpg',
    'assets/images/prof_pic/dzsudlo.jpg',
    'assets/images/prof_pic/bikini.jpg',
  ];
  async ngOnInit() {
    try {
      const userData = await this.authService.getUserData();
      this.user.name = userData.name;
      this.user.username = userData.username;
      this.user.email = userData.email;
      this.user.gdpr = userData.gdpr;
      this.user.img_url = userData.img_url;
      this.selectedPicture =
        this.user.img_url || 'assets/images/prof_pic/bikini.jpg';
      console.log(this.user.img_url);
    } catch (error) {
      console.error('Could not load user data', error);
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

  genres = ['Rock', 'Jazz', 'Indie'];
  locations = ['Budapest - Akvárium', 'Pécs - Nappali'];
  artists = ['Arctic Monkeys', 'Billie Eilish'];

  availableGenres: string[] = [
    'Rock',
    'Jazz',
    'Pop',
    'Indie',
    'Hip-hop',
    'Heavy metal',
  ];
  availableLocations: string[] = ['Budapest - Akvárium', 'Pécs - Nappali'];
  availableArtists: string[] = ['Arctic Monkeys', 'Billie Eilish', 'Krúbi'];

  selectedGenre = '';
  selectedLocation = '';
  selectedArtist = '';

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

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    await this.uploadImage(file);
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      await this.uploadImage(file);
    }
  }

  async uploadImage(file: File) {
    // Check file type
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
      console.error('Invalid file type');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large (max 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const headers = new HttpHeaders().set(
        'Authorization',
        `Bearer ${this.authService.getToken()}`
      );

      // Define response interface
      interface UploadResponse {
        user: {
          img_url: string;
          // add other user properties as needed
        };
        token: string;
      }

      const response = await firstValueFrom(
        this.http.patch<UploadResponse>( // Add type parameter here
          `http://localhost:3000/api/users/update-picture`,
          formData,
          { headers }
        )
      );

      if (response.user) {
        this.user.img_url = response.user.img_url;
        this.selectedPicture = response.user.img_url;
        this.authService.storeToken(response.token);
      }
    } catch (error) {
      console.error('Failed to upload profile picture', error);
    }
  }

  // Remove the readImage function as we don't need it anymore
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  readImage(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      this.selectedPicture = reader.result as string;
      try {
        await this.updateProfilePicture();
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
        genres: this.genres,
        locations: this.locations,
        artists: this.artists,
        availableGenres: this.availableGenres,
        availableLocations: this.availableLocations,
        availableArtists: this.availableArtists,
      },
    });

    document.body.classList.add('modal-open');

    modal.onDidDismiss().then(() => {
      document.body.classList.remove('modal-open');
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

  filterOptions(query: string, options: string[]): string[] {
    const q = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.toLowerCase().includes(q) &&
        !this.genres.includes(opt) &&
        !this.locations.includes(opt) &&
        !this.artists.includes(opt)
    );
  }

  addGenre() {
    if (
      this.selectedGenre &&
      this.availableGenres.includes(this.selectedGenre) &&
      !this.genres.includes(this.selectedGenre)
    ) {
      this.genres.push(this.selectedGenre);
    }
    this.selectedGenre = '';
  }

  addLocation() {
    if (
      this.selectedLocation &&
      this.availableLocations.includes(this.selectedLocation) &&
      !this.locations.includes(this.selectedLocation)
    ) {
      this.locations.push(this.selectedLocation);
    }
    this.selectedLocation = '';
  }

  addArtist() {
    if (
      this.selectedArtist &&
      this.availableArtists.includes(this.selectedArtist) &&
      !this.artists.includes(this.selectedArtist)
    ) {
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
      ? this.availableGenres.filter(
          (opt) =>
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
      ? this.availableLocations.filter(
          (opt) =>
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
      ? this.availableArtists.filter(
          (opt) =>
            opt.toLowerCase().includes(query.toLowerCase()) &&
            !this.artists.includes(opt)
        )
      : [];
  }

  selectArtist(option: string) {
    this.selectedArtist = option;
    this.filteredArtists = [];
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
