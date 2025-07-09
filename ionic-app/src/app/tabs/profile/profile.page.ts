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

  // In your ProfilePage class:

  // Change these to use IDs instead of names
  artists: number[] = [];
  locations: number[] = [];
  genres: number[] = [];
  venues: number[] = [];

  // Update available options to include both ID and name
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
      await this.authService.updatePreferences({
        genres: this.genres,
        locations: this.locations,
        artists: this.artists,
        venues: this.venues,
        see_cancelled: false,
        see_not_available: false,
        notify_push: false,
      });
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
