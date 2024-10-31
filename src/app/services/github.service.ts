import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IRepository } from '../models/integration.model';
import { ApiResponse } from '../models/github.service.model';

const apiRoot = "http://localhost:3000/api/github";

@Injectable({
  providedIn: 'root',
})
export class GithubService {
  constructor(private http: HttpClient) {}

  // Redirect to the GitHub OAuth flow
  connect(): void {
    return window.location.assign(`${apiRoot}/auth`);
  }

  // Disconnect authenticated user
  disconnect(): Observable<any> {
    return this.http.delete(`${apiRoot}/disconnect`);
  }

  // Fetch organizations for the authenticated user
  getOrganizations(): Observable<any> {
    return this.http.get(`${apiRoot}/organizations`);
  }

  // Fetch repositories for the authenticated user in organization
  getRepositories(org: string): Observable<IRepository[]> {
    return this.http.get<IRepository[]>(`${apiRoot}/repositories/${org}`);
  }

  getAdditionalData(org: string, repositories: IRepository[]): Observable<ApiResponse> {
    // Format the payload to only include necessary repository information
    const payload = {
      org,
      repositories: repositories.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        id: repo.id
      }))
    };

    return this.http.post<ApiResponse>(`${apiRoot}/additional-data`, payload);
  }
}