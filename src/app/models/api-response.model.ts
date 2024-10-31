export interface ApiResponseData {
  user: string | undefined;
  commits: number;
  pull_requests: number;
  issues: number;
  stargazers: number;
  forks: number;
}