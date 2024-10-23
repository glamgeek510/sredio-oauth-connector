import mongoose, { Document, Schema } from 'mongoose';

interface IGithubIntegration extends Document {
  user: string;
  accessToken: string;
  connectedAt: Date;
}

const integrationSchema = new Schema<IGithubIntegration>({
  user: { type: String, required: true },
  accessToken: { type: String, required: true },
  connectedAt: { type: Date, required: true },
});

export default mongoose.model<IGithubIntegration>('GithubIntegration', integrationSchema);
