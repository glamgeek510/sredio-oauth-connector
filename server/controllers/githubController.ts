import { Request, Response } from 'express';
import axios from 'axios';
import GithubIntegration from '../models/github-Integration';
import { successResponse, errorResponse } from '../helpers/responseHelper';

export const callback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ message: 'Authorization code is missing' });
    return;
  }

  try {
    // Obtain Access Token
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
    res.redirect(process.env.FRONTEND_URL + `?connected=true&user=${user}`);
  } catch (error) {
    errorResponse(res, 'GitHub OAuth Error', 500);
  }
};

export const initiateOAuth = (req: Request, res: Response) => {
  const githubAuthUrl = process.env.GITHUB_AUTH_URL as string;

  // Redirect the user to GitHub's OAuth authorization page
  res.redirect(githubAuthUrl);
};


export const disconnect = async (req: Request, res: Response): Promise<void> => {
  try {
    // Delete all integration data from the database for user
    await GithubIntegration.deleteMany({});
    successResponse(res, 'Disconnected successfully');
  } catch (error) {
    errorResponse(res, 'Error during disconnection', 500);
  }
};
