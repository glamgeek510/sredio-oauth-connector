import express from 'express';
import { initiateOAuth, callback, disconnect, getOrganizations, getRepositories, getAdditionalData } from '../controllers/githubController';

const router = express.Router();

// Oauth Router Connect
router.get('/auth', initiateOAuth);

// Callback route for GitHub authorization
router.get('/callback', callback);

// Disconnect route for GitHub authorization
router.delete('/disconnect', disconnect);

// Get GitHub organizations
router.get('/organizations', getOrganizations);

// Get GitHub repositories
router.get('/repositories/:org', getRepositories);

// Get additional GitHub data
router.post('/additional-data', getAdditionalData);

export default router;
