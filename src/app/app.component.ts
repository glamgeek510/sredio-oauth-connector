import { Component } from '@angular/core';
import { GithubService } from './services/github.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  connected: boolean = false;
  user: string | null = null;
  open: number = 1;

   githubLogoImage: string = '/assets/img/github-logo/github_logo-words.png';

   githubRoundLogoImage: string = '/assets/img/github-mark/github-logo-mark.png';

   constructor(private githubService: GithubService) {}

   async connect() {
    console.log('Connecting...');
    // Redirects to the backend to initiate OAuth
     this.githubService.connect(); 
     this.open = 0;
   }
 
   async disconnect() {
     try {
       await firstValueFrom(this.githubService.disconnect());
       console.log('Disconnected successfully');
       this.connected = false;
       this.user = null;
     } catch (error) {
       console.error('Disconnection failed:', error);
     }
   }
 
   ngOnInit() {
     // Check if the user was redirected back with connection status
     const params = new URLSearchParams(window.location.search);
     this.connected = params.get('connected') === 'true';
     this.user = params.get('user');
   }
 }