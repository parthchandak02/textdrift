export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  timestamp: number;
  isLive: boolean;
}

const SINGAPORE_API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=1.35&longitude=103.82&current=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=Asia/Singapore';

const FALLBACK_WEATHER: WeatherData = {
  temperature: 28.0,
  windSpeed: 5.0,
  windDirection: 90,
  timestamp: Date.now(),
  isLive: false,
};

export class WeatherService {
  private currentWeather: WeatherData = FALLBACK_WEATHER;
  private listeners: ((weather: WeatherData) => void)[] = [];
  private intervalId: number | null = null;

  constructor() {
    this.fetchWeather(); // Initial fetch
    this.startPolling();
  }

  getCurrentWeather(): WeatherData {
    return this.currentWeather;
  }

  onWeatherUpdate(callback: (weather: WeatherData) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private async fetchWeather(): Promise<void> {
    try {
      const response = await fetch(SINGAPORE_API_URL);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      const weather: WeatherData = {
        temperature: data.current?.temperature_2m ?? FALLBACK_WEATHER.temperature,
        windSpeed: data.current?.wind_speed_10m ?? FALLBACK_WEATHER.windSpeed,
        windDirection: data.current?.wind_direction_10m ?? FALLBACK_WEATHER.windDirection,
        timestamp: Date.now(),
        isLive: true,
      };

      this.updateWeather(weather);
    } catch (error) {
      console.warn('Failed to fetch weather data:', error);
      // Keep using current weather data or fallback
      if (!this.currentWeather.isLive) {
        this.updateWeather({...FALLBACK_WEATHER, timestamp: Date.now()});
      }
    }
  }

  private updateWeather(weather: WeatherData): void {
    this.currentWeather = weather;
    this.listeners.forEach(callback => callback(weather));
  }

  private startPolling(): void {
    // Poll every 60 seconds
    this.intervalId = window.setInterval(() => {
      this.fetchWeather();
    }, 60000);
  }

  destroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listeners.length = 0;
  }
}

export const weatherService = new WeatherService();