import { Component, OnInit, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { GithubService } from './services/github.service';
import { ColDef } from 'ag-grid-community';
import { IOrganization, IRepository } from './models/integration.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiResponseData } from './models/api-response.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  connected: boolean = false;
  user: string | null = null;
  open: number = 1;
  organizations: IOrganization[] = [];
  repositories: IRepository[] = [];
  selectedOrg: string | null = null;
  connectedAt: Date | null = null;
  showUserStats: boolean = false;
  userStatsData: ApiResponseData[] = [];

  githubLogoImage: string = '/assets/img/github-logo/github_logo-words.png';
  githubRoundLogoImage: string = '/assets/img/github-mark/github-logo-mark.png';

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 100, cellStyle: { textAlign: 'left'}},
    { field: 'name', headerName: 'Name', cellStyle: { textAlign: 'left'}},
    { field: 'html_url', headerName: 'Link', cellStyle: { textAlign: 'left'}},
    { field: 'full_name', headerName: 'Slug', cellStyle: { textAlign: 'left'}},
    { 
      field: 'included', 
      headerName: 'Included', 
      width: 100,
      headerCheckboxSelection: true,     
      checkboxSelection: true,
      cellStyle: { textAlign: 'center'},
      cellRenderer: 'agAnimateShowChangeCellRenderer',
      cellRendererParams: {
        checkbox: true
      }
    }
  ];

  defaultColDef: ColDef = {
    initialWidth: 200,
    filter: true,
    sortable: true,
    resizable: true,
    cellStyle: { fontSize: '12px'},
    headerClass: "ag-center-head",
    wrapText: false,
    autoHeight: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
  };


  rowData: any[] = [];
  selectedRepositories: IRepository[] = [];

  constructor(
    private githubService: GithubService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Check if the user was redirected back with connection status
    const params = new URLSearchParams(window.location.search);
    this.user = params.get('user');

    if (this.user) {
      this.fetchOrganizations();
    }
  }

  onSelectionChanged(event: any) {
    this.selectedRepositories = event.api.getSelectedRows();
    this.updateFetchButtonState();
  }

  updateFetchButtonState() {
    const fetchButton = document.querySelector('button[color="primary"]') as HTMLButtonElement;
    if (fetchButton) {
      fetchButton.disabled = this.selectedRepositories.length === 0;
    }
  }

  fetchAdditionalData() {
    this.updateFetchButtonState();
    if (this.selectedRepositories.length > 0) {
      this.spinner.show();
      this.githubService.getAdditionalData(this.selectedOrg as string, this.selectedRepositories)
        .subscribe({
          next: (response) => {
            
            try {
              // Process the repository data
              const aggregatedStats = new Map<string, ApiResponseData>();
              
              response.data.repositories.forEach(repo => {
                if (repo.userStats && Array.isArray(repo.userStats)) {
                  repo.userStats.forEach(contributor => {
                    const userId = contributor.userID as string;
                    
                    if (!aggregatedStats.has(userId)) {
                      aggregatedStats.set(userId, {
                        user: userId,
                        commits: 0,
                        pull_requests: 0,
                        issues: 0,
                        stargazers: 0,
                        forks: 0
                      });
                    }
                    
                    const stats = aggregatedStats.get(userId)!;
                    stats.commits += Number(contributor.commits) || 0;
                    stats.pull_requests += Number(contributor.pull_requests) || 0;
                    stats.issues += Number(contributor.issues) || 0;
                  });
                }
              });
              
              this.userStatsData = Array.from(aggregatedStats.values());
              this.showUserStats = this.userStatsData.length > 0;
              this.changeDetectorRef.detectChanges();
            } catch (error) {
              console.error('Error processing response data:', error);
              this.showUserStats = false;
            }
            
            this.spinner.hide();
          },
          error: (error) => {
            console.error('API request failed:', error);
            this.spinner.hide();
            this.showUserStats = false;
          }
        });
    }
  }

  // Connect the user to GitHub
  connect(): void {
    this.githubService.connect();
    this.open = 0;
  }

  // Disconnect the user from GitHub
  async disconnect() {
    this.spinner.show();
    const doDisconnect = this.githubService.disconnect();
    doDisconnect.subscribe({
      next: () => {
        setTimeout(() => {
          this.connected = false;
          this.user = null;
          this.organizations = [];
          this.repositories = [];
          this.selectedOrg = null;
          this.connectedAt = null;
          this.router.navigate(['/']);
          this.open = 0;
          this.spinner.hide(); 
        }, 5000);
      },
      error: (error) => {
        console.error('Disconnection failed:', error);
      }
    })
  }
  // Fetch organizations when the user selects an organization
  fetchOrganizations() {
    this.spinner.show();
    const result = this.githubService.getOrganizations();
      result.subscribe({
          next: (data) => {
            setTimeout(() => {
                this.organizations = data.data;
                this.connected = true;
                this.spinner.hide();
            }, 3000);
          },
          error: (error) => {
            this.organizations = [];
            console.error('Failed to fetch organizations:', error);
            this.spinner.hide();
          }
    })
  }

  // Fetch repositories when the user selects an organization
  async fetchRepositories(): Promise<void> {
    this.spinner.show();
    const doFetchRepositories = await this.githubService.getRepositories(this.selectedOrg as string);
    doFetchRepositories.subscribe({
          next: (data: any) => {
            setTimeout(() => {
              this.repositories = data.data;
              this.rowData = this.repositories;
              console.log('Received rowData:', this.rowData);
              this.spinner.hide();
            }, 3000);
          },
          error: (error) => {
            console.error(`Failed to fetch repositories for ${this.selectedOrg}:`, error);
            this.repositories = [];
            this.rowData = [];
            this.spinner.hide();
          }
      })
  }
 }