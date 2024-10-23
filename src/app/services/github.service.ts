import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const apiRoot = "http://localhost:3000/api/github"

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  constructor(private http: HttpClient) {}

  // Redirect to the GitHub OAuth flow
  connect(): void {
    window.location.assign(apiRoot + '/auth');
  }
  
  // Checks if the user is connected to GitHub
  disconnect(): Observable<any> {
    return this.http.delete(apiRoot + '/disconnect');
  }
}