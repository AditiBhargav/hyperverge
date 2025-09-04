import { DigilockerDocument, DigilockerSession } from '../types/digilocker';

class DigilockerService {
  private static readonly BASE_URL = 'https://api.digitallocker.gov.in/public/oauth2/1';
  private static readonly CLIENT_ID = process.env.NEXT_PUBLIC_DIGILOCKER_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.NEXT_PUBLIC_DIGILOCKER_CLIENT_SECRET;
  private static readonly REDIRECT_URI = process.env.NEXT_PUBLIC_DIGILOCKER_REDIRECT_URI;

  // Initialize Digilocker authorization
  static getAuthorizationUrl(): string {
    const state = this.generateRandomState();
    localStorage.setItem('digilocker_state', state);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID!,
      redirect_uri: this.REDIRECT_URI!,
      state: state,
      scope: 'push_aadhaar,push_pan'
    });

    return `${this.BASE_URL}/authorize?${params.toString()}`;
  }

  // Handle authorization callback
  static async handleCallback(code: string, state: string): Promise<DigilockerSession> {
    const savedState = localStorage.getItem('digilocker_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    const tokenResponse = await this.getAccessToken(code);
    return this.createSession(tokenResponse);
  }

  // Get user's documents from Digilocker
  static async getDocuments(sessionId: string): Promise<DigilockerDocument[]> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Invalid session');

    const headers = {
      'Authorization': `Bearer ${session.accessToken}`
    };

    const response = await fetch(`${this.BASE_URL}/documents`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  // Helper functions
  private static generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private static async getAccessToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.CLIENT_ID!,
      client_secret: this.CLIENT_SECRET!,
      redirect_uri: this.REDIRECT_URI!
    });

    const response = await fetch(`${this.BASE_URL}/token`, {
      method: 'POST',
      body: params
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    return response.json();
  }

  private static async createSession(tokenResponse: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }): Promise<DigilockerSession> {
    // Implement session creation logic
    // Store in your database/state management
    return {
      id: Math.random().toString(36).substring(2, 15),
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000)
    };
  }

  private static async getSession(sessionId: string): Promise<DigilockerSession | null> {
    // Implement session retrieval logic
    // This should check your database/state management
    return null;
  }
}

export default DigilockerService;
