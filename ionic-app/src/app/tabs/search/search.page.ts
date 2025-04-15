import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonImg, IonCardHeader, IonCardTitle, IonCardSubtitle, IonLabel, IonChip } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { ConcertCardComponent } from "../../components/concert-card/concert-card.component";
import { ConcertCardFullComponent } from "../../components/concert-card-full/concert-card-full.component";
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ConcertCardComponent, ConcertCardFullComponent]
})
export class SearchPage implements OnInit {

  
  constructor() { }

  ngOnInit() {
  }

  searchQuery = '';
  recentSearches = ['Budapest', 'Rock', 'Metallica', 'Jazz', 'Debrecen', 'Taylor Swift', 'Pop', 'Hip-Hop', 'Szeged', 'EDM', 'Budapest', 'Rock', 'Metallica', 'Jazz'];

  cities = ['Budapest', 'Debrecen', 'Szeged', 'Győr'];
  genres = ['Rock', 'Pop', 'Jazz', 'EDM', 'Hip-Hop'];

  selectedCity = '';
  selectedGenre = '';

  results = [
    {
      title: 'Rocking Budapest',
      date: '2025-05-12',
      location: 'Budapest',
      image: 'assets/images/asd.jpg',
      genre: 'Rock',
      artist: 'Metallica',
    },
    {
      title: 'Jazz Night',
      date: '2025-06-02',
      location: 'Debrecen',
      image: 'assets/images/aa.jpg',
      genre: 'Jazz',
      artist: 'Norah Jones',
    },
    {
      title: 'Jazz Night',
      date: '2025-06-02',
      location: 'Debrecen',
      image: 'assets/images/aa.jpg',
      genre: 'Jazz',
      artist: 'Norah Jones',
    },
    {
      title: 'Rocking Budapest',
      date: '2025-05-12',
      location: 'Budapest',
      image: 'assets/images/asd.jpg',
      genre: 'Rock',
      artist: 'Metallica',
    },
    // Add more dummy concert objects
  ];

  get filteredResults() {
    return this.results.filter((concert) => {
      const matchesQuery = this.searchQuery === '' || concert.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || concert.artist.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCity = this.selectedCity === '' || concert.location === this.selectedCity;
      const matchesGenre = this.selectedGenre === '' || concert.genre === this.selectedGenre;
      return matchesQuery && matchesCity && matchesGenre;
    });
  }

  onSearchChange() {
    // Autocomplete or API logic later
  }
}
