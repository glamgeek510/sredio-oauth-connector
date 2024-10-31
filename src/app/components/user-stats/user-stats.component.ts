import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { ApiResponseData } from '../../models/api-response.model';
import { UserStats } from '../../models/user-stats.model';

@Component({
  selector: 'app-user-stats',
  templateUrl: './user-stats.component.html',
  styleUrls: []
})
export class UserStatsComponent implements OnChanges, OnInit {
  @Input() userData: ApiResponseData[] = [];

  userStats: UserStats[] = [];
  rowData: any[] = [];

  columnDefs: ColDef[] = [
    { field: 'user', headerName: 'User', sortable: true, filter: true, cellStyle: { textAlign: 'center' }},
    { field: 'totalCommits', headerName: 'Total Commits', sortable: true, filter: true, cellStyle: { textAlign: 'center' } },
    { field: 'totalPullRequests', headerName: 'Total Pull Requests', sortable: true, filter: true, cellStyle: { textAlign: 'center' } },
    { field: 'totalIssues', headerName: 'Total Issues', sortable: true, filter: true, cellStyle: { textAlign: 'center' } }
  ];

  defaultColDef: ColDef = {
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


  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.processData(this.userData);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userData']) {
      try {
        if (this.userData?.length > 0) {
          this.processData(this.userData);
        } else {
          this.userStats = [];
        }
      } catch (error) {
        console.error('Error processing userData:', error);
        this.userStats = [];
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  // Get passed data into userStats array and update the component
  processData(data: ApiResponseData[]) {
    if (!Array.isArray(data) || data.length === 0) {
      this.userStats = [];
      return;
    }

    const userMap = new Map<string, UserStats>();

    data.forEach((item: ApiResponseData) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const user = item.user;
      if (user && typeof user === 'string' && user.trim() !== '') {
        if (!userMap.has(user)) {

          userMap.set(user, {
            user,
            totalCommits: 0,
            totalPullRequests: 0,
            totalIssues: 0
          });
        }

        const userStats = userMap.get(user)!;
        userStats.totalCommits += Number(item.commits) || 0;
        userStats.totalPullRequests += Number(item.pull_requests) || 0;
        userStats.totalIssues += Number(item.issues) || 0;
      }
    });

    this.userStats = Array.from(userMap.values());
    this.changeDetectorRef.detectChanges();
  }
}