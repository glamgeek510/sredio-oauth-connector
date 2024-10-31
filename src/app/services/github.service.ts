import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, from, map, mergeMap, Observable, of } from 'rxjs';
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
    return new Observable<ApiResponse>(observer => {
      from(repositories).pipe(
        mergeMap(repo => {
          const payload = {
            org,
            repositories: [{
              name: repo.name,
              full_name: repo.full_name,
              id: repo.id
            }]
          };
          return this.http.post<ApiResponse>(`${apiRoot}/additional-data`, payload).pipe(
            catchError(error => {
              console.error(`Error processing repository ${repo.name}:`, error);
              return of(null);
            }),
            map(response => response ? { ...response, repository: repo.name } : null)
          );
        }, 3) // Limit concurrent requests to 3
      ).subscribe({
        next: response => {
          if (response) {
            observer.next(response);
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }
}