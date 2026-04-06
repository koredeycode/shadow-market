import axios from 'axios';

export interface BackendConfig {
  baseUrl: string;
}

export class BackendClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(config: BackendConfig) {
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async login(address: string) {
    const response = await axios.post(`${this.baseUrl}/users/auth`, { address });
    if (response.data.success) {
      this.token = response.data.data.token;
      return response.data.data;
    }
    throw new Error(response.data.error || 'Authentication failed');
  }

  async getMarkets(filters: any = {}) {
    const response = await axios.get(`${this.baseUrl}/markets`, { 
      params: filters,
      headers: this.getHeaders()
    });
    
    // Check if the response matches PaginatedResponse structure
    const data = response.data.data;
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data.items;
    }
    
    return Array.isArray(data) ? data : [];
  }

  async createMarket(marketData: any) {
    const response = await axios.post(`${this.baseUrl}/markets`, marketData, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async placeBet(marketId: string, betData: any) {
    const response = await axios.post(`${this.baseUrl}/markets/${marketId}/bets`, betData, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getMarket(id: string) {
    const response = await axios.get(`${this.baseUrl}/markets/${id}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getMarketHistory(id: string) {
    const response = await axios.get(`${this.baseUrl}/markets/${id}/history`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getWagers(marketId: string) {
    const response = await axios.get(`${this.baseUrl}/markets/${marketId}/wagers`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async createP2PWager(marketId: string, wagerData: any) {
    const response = await axios.post(`${this.baseUrl}/markets/${marketId}/wagers`, wagerData, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async updateWagerSync(marketId: string, wagerId: string, updateData: any) {
    const response = await axios.patch(`${this.baseUrl}/markets/${marketId}/wagers/${wagerId}`, updateData, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getLinkCode(walletAddress: string) {
    const response = await axios.post(`${this.baseUrl}/sessions/create`, { walletAddress });
    const session = response.data.data;
    return {
      code: session.pairingCode,
      expiresAt: session.expiresAt
    };
  }

  async pollLinkStatus(code: string) {
    const response = await axios.get(`${this.baseUrl}/sessions/${code}/status`);
    return response.data.data;
  }

  async getMe() {
    const response = await axios.get(`${this.baseUrl}/users/me`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getPortfolio() {
    const response = await axios.get(`${this.baseUrl}/users/me/portfolio`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getUserWagers() {
    const response = await axios.get(`${this.baseUrl}/users/me/wagers`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getAdminConfig() {
    const response = await axios.get(`${this.baseUrl}/admin/config`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  private getHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

export const backendClient = new BackendClient({
  baseUrl: process.env.BACKEND_API_URL || 'http://localhost:3000/api'
});
