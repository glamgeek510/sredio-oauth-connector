export interface ContributorStats {
    login: string;
    userID?: string;
    commits: number;
    pull_requests: number;
    issues: number;
  }
  
export interface RepositoryStats {
    name: string;
    userStats: ContributorStats[];
    contributors: ContributorStats[];
}
  
export interface ApiResponse {
    data: {
      repositories: RepositoryStats[];
    };
}