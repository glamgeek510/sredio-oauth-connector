import { Request, Response } from 'express';
import axios from 'axios';
import GithubIntegration from '../models/github-Integration';
import { successResponse, errorResponse, dataOrgResponse, redirectResponse } from '../helpers/responseHelper';
import { GitHubRepoResponseData } from '../models/github-data-types';

export const getAdditionalData = async (req: Request, res: Response) => {
  try {
    const { org, repositories } = req.body;
    if (!Array.isArray(repositories) || repositories.length === 0) {
      return errorResponse(res, 'Invalid repositories data', 400);
    }

    const githubIntegration = await GithubIntegration.findOne();
    if (!githubIntegration) {
      return errorResponse(res, 'GitHub integration not found', 404);
    }

    const headers = {
      Authorization: `token ${githubIntegration.accessToken}`,
      Accept: 'application/vnd.github+json',
    };

    // Fetch data for each repository
    const repoDataPromises = repositories.map(async (repo: GitHubRepoResponseData) => {
      const userStats: { [key: string]: { commits: number, pull_requests: number, issues: number } } = {};

      // Helper function to fetch all pages
      const fetchAllPages = async (url: string) => {
        let page = 1;
        let allData: any[] = [];
        let hasNextPage = true;

        while (hasNextPage) {
          const response = await axios.get(`${url}page=${page}state=all&per_page=100`, { headers });
          allData = [...allData, ...response.data];
          hasNextPage = response.headers.link && response.headers.link.includes('rel="next"');
          page++;
        }

        return allData;
      };

      const [commits, pullRequests, issues] = await Promise.all([
        fetchAllPages(`${process.env.GITHUB_API_URL}/repos/${org}/${repo.name}/commits?`),
        fetchAllPages(`${process.env.GITHUB_API_URL}/repos/${org}/${repo.name}/pulls?`),
        fetchAllPages(`${process.env.GITHUB_API_URL}/repos/${org}/${repo.name}/issues?`)
      ]);

      commits.forEach((commit: any) => {
        const author = commit.author ? commit.author.login : 'Unknown';
        if (!userStats[author]) userStats[author] = { commits: 0, pull_requests: 0, issues: 0 };
        userStats[author].commits++;
      });

      pullRequests.forEach((pr: any) => {
        const author = pr.user ? pr.user.login : 'Unknown';
        if (!userStats[author]) userStats[author] = { commits: 0, pull_requests: 0, issues: 0 };
        userStats[author].pull_requests++;
      });

      issues.forEach((issue: any) => {
        if (!issue.pull_request) {  // Exclude pull requests from issues count
          const author = issue.user ? issue.user.login : 'Unknown';
          if (!userStats[author]) userStats[author] = { commits: 0, pull_requests: 0, issues: 0 };
          userStats[author].issues++;
        }
      });

      return {
        name: org,
        userStats: Object.entries(userStats).map(([user, stats]) => ({
          userID: user,
          User: user,
          ...stats
        }))
      };
    });

    const repoData = await Promise.all(repoDataPromises);

    return successResponse(res, 'Additional data fetched successfully', { repositories: repoData });
  } catch (error) {
    console.error('Error fetching additional data:', error);
    return errorResponse(res, 'Failed to fetch additional data', 500);
  }
};

export const getOrganizations = async (req: Request, res: Response) => {

  try {
    const githubIntegration = await GithubIntegration.findOne();
    if (!githubIntegration) {
      return errorResponse(res, 'GitHub integration not found', 404);
    }

    let allOrganizations: any[] = [];
    const response = await axios.get(`${process.env.GITHUB_ORGANIZATIONS_URL}`, {
        headers: {
          Authorization: `token ${githubIntegration.accessToken}`,
          Accept: 'application/vnd.github+json',
        },
    });

    allOrganizations = [...allOrganizations, ...response.data];
    return dataOrgResponse(res, allOrganizations);
  } catch (error) {
    console.error('Error fetching GitHub organizations:', error);
    return errorResponse(res, 'Failed to fetch GitHub organizations', 500);
  }
};

export const getRepositories = async (req: Request, res: Response) => {

  try {
    const { org } = req.params;
    const githubIntegration = await GithubIntegration.findOne();
    if (!githubIntegration) {
      return errorResponse(res, 'GitHub integration not found', 404);
    }
    let allRepositories: any[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await axios.get(`${process.env.GITHUB_API_URL}/orgs/${org}/repos?page=${page}&per_page=100`, {
        headers: {
          Authorization: `token ${githubIntegration.accessToken}`,
          Accept: "application/vnd.github.v3+json"
        },
      });
      allRepositories = [...allRepositories, ...response.data];
      if (response.data.length < 100) {
        hasMorePages = false;
      } else {
        page++;
      }
    }
    return dataOrgResponse(res, allRepositories);
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return errorResponse(res, 'Failed to fetch GitHub repositories', 500);
  }
};

export const callback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ message: 'Authorization code is missing' });
    return;
  }

  try {
    // Get Access Token from GitHub
    const tokenResponse = await axios.post(
      process.env.GITHUB_ACCESS_TOKEN_URL as string,
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );
    const { access_token } = tokenResponse.data;
    // Get User Details from GitHub API using the access token
    const userResponse = await axios.get(process.env.GITHUB_USER_AUTH_REDIRECT_URL as string, {
      headers: { Authorization: `token ${access_token}` },
    });

    const user = userResponse.data.login;
    // Store to the DB
    const integration = new GithubIntegration({
      user,
      accessToken: access_token,
      connectedAt: new Date(),
    });
    await integration.save();
    res.redirect(process.env.FRONTEND_URL + `?user=${user}`);
  } catch (error) {
    errorResponse(res, 'GitHub OAuth Error', 500);
  }
};

export const initiateOAuth = (req: Request, res: Response) => {
  const githubAuthUrl = process.env.GITHUB_AUTH_URI as string;
  // Redirect the user to GitHub's OAuth authorization page
  res.redirect(githubAuthUrl);
};

export const disconnect = async (req: Request, res: Response): Promise<void> => {
  try {
    // Delete all Github integration data from the database for authenticated user
    // We will handle page refresh from the clientside
    await GithubIntegration.deleteMany({});
    successResponse(res, "Disconnected Successfully")
  } catch (error) {
    errorResponse(res, 'Error during disconnection', 500);
  }
};
