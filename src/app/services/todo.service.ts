import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TodoService implements OnDestroy {
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.tasksSubject.asObservable();

  private userSubscription?: Subscription;

  constructor(private readonly authService: AuthService) {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.loadTasks(user.id);
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
    if (!user) {
      throw new Error('Cannot add tasks while signed out.');
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: new Date(),
    };

    const updatedTasks = [newTask, ...this.tasksSubject.value];
    this.updateTasks(updatedTasks, user.id);
  }

  toggleTask(id: string): void {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('Cannot modify tasks while signed out.');
    }

    const updatedTasks = this.tasksSubject.value.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    this.updateTasks(updatedTasks, user.id);
  }

  deleteTask(id: string): void {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('Cannot delete tasks while signed out.');
    }

    const updatedTasks = this.tasksSubject.value.filter(task => task.id !== id);
    this.updateTasks(updatedTasks, user.id);
  }

  updateTask(id: string, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('Cannot edit tasks while signed out.');
    }

    const updatedTasks = this.tasksSubject.value.map(task =>
      task.id === id ? { ...task, text: trimmed } : task
    );
    this.updateTasks(updatedTasks, user.id);
  }

  private updateTasks(tasks: Task[], userId: string): void {
    this.tasksSubject.next(tasks);
    this.saveTasks(tasks, userId);
  }

  private saveTasks(tasks: Task[], userId: string): void {
    try {
      const key = `todo_app_tasks_${userId}`;
      const serializable = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  private loadTasks(userId: string): void {
    try {
      const key = `todo_app_tasks_${userId}`;
      const saved = localStorage.getItem(key);
      if (!saved) {
        this.tasksSubject.next([]);
        return;
      }

      const parsed: Array<Task & { createdAt: string }> = JSON.parse(saved);
      const tasks = parsed.map(task => ({
        ...task,
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      }));

      // Sort by creation date (newest first)
      tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.tasksSubject.next(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasksSubject.next([]);
    }
  }
}
