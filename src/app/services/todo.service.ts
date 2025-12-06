import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, catchError, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';

interface TaskApiResponse {
  _id?: string;
  id?: string;
  text: string;
  completed: boolean;
  createdAt: string | Date;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class TodoService implements OnDestroy {
  private readonly apiUrl = 'https://ecommerce.routemisr.com';
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.tasksSubject.asObservable();

  private userSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.loadTasks(user.id!);
      } else {
        this.tasksSubject.next([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  addTask(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const user = this.authService.currentUser;
    if (!user || !user.id) {
      throw new Error('Cannot add tasks while signed out.');
    }

    const taskData = {
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Try API first, fallback to localStorage if API fails
    this.http
      .post<TaskApiResponse>(`${this.apiUrl}/api/v1/todos`, taskData)
      .pipe(
        map((response) => this.mapApiTaskToTask(response)),
        catchError((error) => {
          console.warn('API call failed, using localStorage fallback:', error);
          // Fallback to localStorage
          const newTask: Task = {
            id: Date.now().toString(),
            text: trimmed,
            completed: false,
            createdAt: new Date(),
          };
          const updatedTasks = [newTask, ...this.tasksSubject.value];
          this.saveTasksToLocalStorage(updatedTasks, user.id);
          this.tasksSubject.next(updatedTasks);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (task) => {
          const updatedTasks = [task, ...this.tasksSubject.value];
          this.tasksSubject.next(updatedTasks);
        },
        error: () => {
          // Error already handled in catchError with fallback
        },
      });
  }

  toggleTask(id: string): void {
    const user = this.authService.currentUser;
    if (!user || !user.id) {
      throw new Error('Cannot modify tasks while signed out.');
    }

    const task = this.tasksSubject.value.find(t => t.id === id);
    if (!task) {
      return;
    }

    const updatedTask = { ...task, completed: !task.completed };

    // Try API first, fallback to localStorage if API fails
    this.http
      .put<TaskApiResponse>(`${this.apiUrl}/api/v1/todos/${id}`, {
        completed: updatedTask.completed,
      })
      .pipe(
        map((response) => this.mapApiTaskToTask(response)),
        catchError((error) => {
          console.warn('API call failed, using localStorage fallback:', error);
          // Fallback to localStorage
          const updatedTasks = this.tasksSubject.value.map(t =>
            t.id === id ? updatedTask : t
          );
          this.saveTasksToLocalStorage(updatedTasks, user.id);
          this.tasksSubject.next(updatedTasks);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (task) => {
          const updatedTasks = this.tasksSubject.value.map(t =>
            t.id === id ? task : t
          );
          this.tasksSubject.next(updatedTasks);
        },
        error: () => {
          // Error already handled in catchError with fallback
        },
      });
  }

  deleteTask(id: string): void {
    const user = this.authService.currentUser;
    if (!user || !user.id) {
      throw new Error('Cannot delete tasks while signed out.');
    }

    // Optimistically update UI
    const updatedTasks = this.tasksSubject.value.filter(task => task.id !== id);
    this.tasksSubject.next(updatedTasks);

    // Try API first, fallback to localStorage if API fails
    this.http
      .delete(`${this.apiUrl}/api/v1/todos/${id}`)
      .pipe(
        catchError((error) => {
          console.warn('API call failed, using localStorage fallback:', error);
          // Fallback to localStorage
          this.saveTasksToLocalStorage(updatedTasks, user.id);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: () => {
          // Task deleted successfully from API
        },
        error: () => {
          // Error already handled in catchError with fallback
        },
      });
  }

  updateTask(id: string, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const user = this.authService.currentUser;
    if (!user || !user.id) {
      throw new Error('Cannot edit tasks while signed out.');
    }

    // Try API first, fallback to localStorage if API fails
    this.http
      .put<TaskApiResponse>(`${this.apiUrl}/api/v1/todos/${id}`, {
        text: trimmed,
      })
      .pipe(
        map((response) => this.mapApiTaskToTask(response)),
        catchError((error) => {
          console.warn('API call failed, using localStorage fallback:', error);
          // Fallback to localStorage
          const updatedTasks = this.tasksSubject.value.map(task =>
            task.id === id ? { ...task, text: trimmed } : task
          );
          this.saveTasksToLocalStorage(updatedTasks, user.id);
          this.tasksSubject.next(updatedTasks);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (task) => {
          const updatedTasks = this.tasksSubject.value.map(t =>
            t.id === id ? task : t
          );
          this.tasksSubject.next(updatedTasks);
        },
        error: () => {
          // Error already handled in catchError with fallback
        },
      });
  }

  private loadTasks(userId: string): void {
    // Try API first, fallback to localStorage if API fails
    this.http
      .get<TaskApiResponse[]>(`${this.apiUrl}/api/v1/todos`)
      .pipe(
        map((response) => {
          const tasks = response.map(task => this.mapApiTaskToTask(task));
          // Sort by creation date (newest first)
          tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return tasks;
        }),
        catchError((error) => {
          console.warn('API call failed, using localStorage fallback:', error);
          // Fallback to localStorage
          const tasks = this.loadTasksFromLocalStorage(userId);
          return of(tasks);
        })
      )
      .subscribe({
        next: (tasks) => {
          this.tasksSubject.next(tasks);
        },
        error: () => {
          // Error already handled in catchError with fallback
        },
      });
  }

  private loadTasksFromLocalStorage(userId: string): any {
    try {
      const key = `todo_app_tasks_${userId}`;
      const saved = localStorage.getItem(key);
      if (!saved) {
        this.tasksSubject.next([]);
        return [];
      }

      const parsed: Array<Task & { createdAt: string }> = JSON.parse(saved);
      const tasks = parsed.map(task => ({
        ...task,
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      }));

      // Sort by creation date (newest first)
      tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return tasks;
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
      return [];
    }
  }

  private saveTasksToLocalStorage(tasks: Task[], userId: string): void {
    try {
      const key = `todo_app_tasks_${userId}`;
      const serializable = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  private mapApiTaskToTask(apiTask: TaskApiResponse): Task {
    return {
      id: apiTask._id || apiTask.id || Date.now().toString(),
      text: apiTask.text,
      completed: apiTask.completed,
      createdAt: apiTask.createdAt
        ? new Date(apiTask.createdAt)
        : new Date(),
    };
  }
}
