import { computed, Injectable, signal } from '@angular/core';

export interface AuthUser {
  fullName: string;
  email: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

interface AuthResult {
  success: boolean;
  message: string;
}

const currentUserKey = 'velora_current_user';
const registeredUsersKey = 'velora_registered_users';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<AuthUser | null>(this.readCurrentUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isSignedIn = computed(() => this.currentUserSignal() !== null);

  register(fullName: string, email: string, password: string): AuthResult {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.readUsers();
    const accountExists = users.some((user) => user.email === cleanEmail);

    if (accountExists) {
      return { success: false, message: 'This email is already registered. Please sign in.' };
    }

    users.push({
      fullName: fullName.trim(),
      email: cleanEmail,
      password
    });

    this.saveUsers(users);
    return { success: true, message: 'Account created. Please sign in to continue.' };
  }

  signIn(email: string, password: string): AuthResult {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.readUsers().find((item) => item.email === cleanEmail);

    if (!user) {
      return { success: false, message: 'No account found. Please register first.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Password is incorrect.' };
    }

    const currentUser: AuthUser = {
      fullName: user.fullName,
      email: user.email
    };

    this.currentUserSignal.set(currentUser);
    this.writeStorage(currentUserKey, currentUser);

    return { success: true, message: 'Signed in successfully.' };
  }

  updateProfile(fullName: string, email: string): AuthResult {
    const currentUser = this.currentUserSignal();

    if (!currentUser) {
      return { success: false, message: 'Please sign in before updating your profile.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.readUsers();
    const emailExists = users.some((user) => user.email === cleanEmail && user.email !== currentUser.email);

    if (emailExists) {
      return { success: false, message: 'This email is already used by another account.' };
    }

    const updatedUser: AuthUser = {
      fullName: fullName.trim(),
      email: cleanEmail
    };

    const userIndex = users.findIndex((user) => user.email === currentUser.email);

    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        ...updatedUser
      };
      this.saveUsers(users);
    }

    this.currentUserSignal.set(updatedUser);
    this.writeStorage(currentUserKey, updatedUser);

    return { success: true, message: 'Profile saved.' };
  }

  signOut(): void {
    this.currentUserSignal.set(null);
    this.removeStorage(currentUserKey);
  }

  private readCurrentUser(): AuthUser | null {
    return this.readStorage<AuthUser>(currentUserKey);
  }

  private readUsers(): StoredUser[] {
    return this.readStorage<StoredUser[]>(registeredUsersKey) ?? [];
  }

  private saveUsers(users: StoredUser[]): void {
    this.writeStorage(registeredUsersKey, users);
  }

  private readStorage<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  private writeStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }
}
