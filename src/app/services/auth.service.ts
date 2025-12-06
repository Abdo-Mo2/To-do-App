import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id?: string;
  email: string;
  name?: string;
  displayName?: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'https://ecommerce.routemisr.com';
  private readonly tokenKey = 'todo_app_token';
  private readonly currentUserKey = 'todo_app_current_user';
  private readonly userSubject = new BehaviorSubject<User | null>(this.loadCurrentUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {
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

  private getAllUsers(): Array<User & { password: string }> {
    try {
      const saved = localStorage.getItem('todo_app_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveAllUsers(users: Array<User & { password: string }>): void {
    try {
      localStorage.setItem('todo_app_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this.http
        .post<LoginResponse>(`${this.apiUrl}/api/v1/auth/login`, {
          email,
          password,
        })
        .pipe(
          map((response) => {
            // Store token
            localStorage.setItem(this.tokenKey, response.token);
            
            // Map API user to our User interface
            const user: User = {
              id: response.user.id || response.user.email,
              email: response.user.email,
              displayName: response.user.name || response.user.displayName || response.user.email,
              name: response.user.name,
              role: response.user.role,
            };

            this.setCurrentUser(user);
            return user;
          }),
          catchError((error) => {
            let errorMessage = 'Invalid email or password. Please try again.';
            
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            return throwError(() => new Error(errorMessage));
          })
        )
        .subscribe({
          next: (user) => resolve(user),
          error: (err) => reject(err),
        });
    });
  }

  signOut(): Promise<void> {
    localStorage.removeItem(this.currentUserKey);
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    return Promise.resolve();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUser;
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
