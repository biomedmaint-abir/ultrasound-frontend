import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache: { [key: string]: { data: any, timestamp: number } } = {};
  private TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache[key] = { data, timestamp: Date.now() };
  }

  get(key: string): any | null {
    const entry = this.cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      delete this.cache[key];
      return null;
    }
    return entry.data;
  }

  clear(): void { this.cache = {}; }
}
