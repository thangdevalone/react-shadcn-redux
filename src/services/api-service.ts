import axios, {AxiosRequestConfig} from "axios";
import {appConfig} from "@/configs/app-config.ts";

export class ApiService {
  axiosInstance = axios.create({
    baseURL: appConfig.apiBase,
  });
  auth = {
    accessToken: '',
    refreshToken: '',
  }

  constructor() {
  }

  async post(endpoint: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.callApi('POST', endpoint, data, config);
  }

  async get(endpoint: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.callApi('GET', endpoint, data, config);
  }

  async put(endpoint: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.callApi('PUT', endpoint, data, config);
  }

  async patch(endpoint: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.callApi('PATCH', endpoint, data, config);
  }

  async delete(endpoint: string, data: any, config: AxiosRequestConfig = {}) {
    return this.callApi('DELETE', endpoint, data, config);
  }

  setCredentials(credentials: (typeof this.auth)) {
    this.auth = credentials;
    return this.refreshTokenCheck();
  }

  async callApi(method: string, endpoint: string, data: any = {}, config?: AxiosRequestConfig, ignoreAuth = false) {
    if (!ignoreAuth) await this.refreshTokenCheck();
    try {
      const r = await this.axiosInstance({
        method,
        url: endpoint,
        data,
        headers: {
          Authorization: this.auth.accessToken ? `Bearer ${this.auth.accessToken}` : undefined,
        },
        ...config,
      });
      return r.data;
    } catch (e: any) {
      if (e.response) {
        const {message, statusCode} = e.response.data;
        if (statusCode === 401 && message === "SESSION_EXPIRED") {
          await this.setCredentials({
            accessToken: '',
            refreshToken: '',
          });
          window.location.reload();
        }
        if (e.response.data) throw e.response.data;
        throw e.response;
      } else {
        throw e;
      }
    }
  }

  async refreshTokenCheck() {
    if (this.auth.accessToken) {
      const tokenData = JSON.parse(atob(this.auth.accessToken.split('.')[1]));
      if (tokenData.exp <= ~~(new Date().getTime() / 1000)) {
        const {data: tokenResponse} = await this.callApi('POST', '/auth/jwt/refresh', {
          refresh_token: this.auth.accessToken,
        }, {}, true).then();

        await this.setCredentials({
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
        });
      }
    }
  }

}
