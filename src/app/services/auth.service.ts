import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersKey = 'todo_app_users';
  private readonly currentUserKey = 'todo_app_current_user';
  private readonly userSubject = new BehaviorSubject<User | null>(this.loadCurrentUser());
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    // Load current user on initialization
    const user = this.loadCurrentUser();
    if (user) {
      this.userSubject.next(user);
    }
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get currentUserId(): string | null {
    return this.currentUser?.id ?? null;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const users = this.getAllUsers();
    
    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('That email is already registered. Try logging in instead.');
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      displayName: displayName.trim(),
    };

    // Store user (in a real app, you'd hash the password)
    users.push({ ...newUser, password }); // Store password (not secure, but simple)
    this.saveAllUsers(users);

    // Auto-login after signup
    this.setCurrentUser(newUser);
    return newUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    const users = this.getAllUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password. Please try again.');
    }

    const userWithoutPassword: User = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    this.setCurrentUser(userWithoutPassword);
    return userWithoutPassword;
  }

  signOut(): Promise<void> {
    localStorage.removeItem(this.currentUserKey);
    this.userSubject.next(null);
    return Promise.resolve();
  }

  getErrorMessage(error: any): string {
    if (!error) {
      return 'An unknown error occurred. Please try again.';
    }

    if (typeof error === 'string') {
      return error;
    }

    return error.message || 'An unexpected error occurred.';
  }

  private getAllUsers(): Array<User & { password: string }> {
    try {
      const saved = localStorage.getItem(this.usersKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveAllUsers(users: Array<User & { password: string }>): void {
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private loadCurrentUser(): User | null {
    try {
      const saved = localStorage.getItem(this.currentUserKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private setCurrentUser(user: User): void {
    try {
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));
      this.userSubject.next(user);
    } catch (error) {
      console.error('Error saving current user:', error);
    }
  }
}
