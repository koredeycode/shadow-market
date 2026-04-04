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
    return response.data.data;
  }

  async createMarket(marketData: any) {
    const response = await axios.post(`${this.baseUrl}/markets`, marketData, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async placeBet(betData: any) {
    const response = await axios.post(`${this.baseUrl}/markets/bet`, betData, {
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

  async getWagers(marketId: string) {
    const response = await axios.get(`${this.baseUrl}/wagers/market/${marketId}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async createP2PWager(wagerData: any) {
    const response = await axios.post(`${this.baseUrl}/wagers/p2p`, wagerData, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async acceptP2PWager(id: string, txHash?: string) {
    const response = await axios.post(`${this.baseUrl}/wagers/p2p/${id}/accept`, { txHash }, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async cancelWager(id: string) {
    const response = await axios.delete(`${this.baseUrl}/wagers/p2p/${id}`, {
      headers: this.getHeaders()
    });
    return response.data.data;
  }

  async getLinkCode() {
    const response = await axios.get(`${this.baseUrl}/users/link/code`);
    return response.data.data;
  }

  async pollLinkStatus(code: string) {
    const response = await axios.get(`${this.baseUrl}/users/link/poll/${code}`);
    return response.data.data;
  }

  async getMe() {
    const response = await axios.get(`${this.baseUrl}/users/me`, {
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
