import express from 'express';
import { initiateOAuth, callback, disconnect } from '../controllers/githubController';

const router = express.Router();

// Oauth Router Connect
router.get('/auth', initiateOAuth);

// Callback route for GitHub authorization
router.get('/callback', callback);

// Disconnect route for GitHub authorization
router.delete('/disconnect', disconnect);

export default router;
