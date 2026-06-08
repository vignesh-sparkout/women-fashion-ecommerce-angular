import { computed, Injectable, signal } from '@angular/core';

interface AdminResult {
  success: boolean;
  message: string;
}

const adminSessionKey = 'velora_admin_signed_in';
const adminEmail = 'vicky@gmail.com';
const adminPassword = '777777';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly signedInSignal = signal(this.readSession());

  readonly isAdminSignedIn = computed(() => this.signedInSignal());

  signIn(email: string, password: string): AdminResult {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== adminEmail || password !== adminPassword) {
      return { success: false, message: 'Invalid admin email or password.' };
    }

    this.signedInSignal.set(true);
    this.writeSession(true);
    return { success: true, message: 'Admin signed in successfully.' };
  }

  signOut(): void {
    this.signedInSignal.set(false);
    this.writeSession(false);
  }

  private readSession(): boolean {
    try {
      return localStorage.getItem(adminSessionKey) === 'true';
    } catch {
      return false;
    }
  }

  private writeSession(value: boolean): void {
    try {
      localStorage.setItem(adminSessionKey, String(value));
    } catch {
      return;
    }
  }
}
