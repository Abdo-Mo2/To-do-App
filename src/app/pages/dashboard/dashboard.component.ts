import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { FilterType, Task } from '../../models/task.model';
import { TodoService } from '../../services/todo.service';
import { AuthService } from '../../services/auth.service';
import { TodoListComponent } from '../../components/todo-list/todo-list.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerRef', { read: ElementRef }) headerRef!: ElementRef<HTMLElement>;
  @ViewChild('addTodoRef', { read: ElementRef }) addTodoRef!: ElementRef<HTMLElement>;
  @ViewChild(TodoListComponent) todoListComponent?: TodoListComponent;

  get user$() {
    return this.authService.user$;
  }

  getUserDisplayName(user: any): string {
    if (!user) return 'User';
    return user.displayName || user.email || 'User';
  }

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentFilter: FilterType = 'all';
  isDarkMode = false;
  errorMessage: string | null = null;

  totalCount = 0;
  completedCount = 0;
  pendingCount = 0;

  private subscription?: Subscription;

  constructor(
    private readonly todoService: TodoService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.subscription = this.todoService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
      this.updateStats();
      this.applyFilter();
    });

    this.loadTheme();
  }

  ngAfterViewInit(): void {
    this.animateAppLoad();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async handleAddTask(text: string): Promise<void> {
    this.clearError();
    try {
      await this.todoService.addTask(text);
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleToggleTask(id: string): Promise<void> {
    this.clearError();
    try {
      await this.todoService.toggleTask(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleDeleteTask(id: string): Promise<void> {
    this.clearError();
    try {
      await this.todoService.deleteTask(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async handleUpdateTask(update: { id: string; text: string }): Promise<void> {
    this.clearError();
    try {
      await this.todoService.updateTask(update.id, update.text);
    } catch (error) {
      this.handleError(error);
    }
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.router.navigateByUrl('/login');
  }

  setFilter(filter: FilterType): void {
    if (this.currentFilter === filter) {
      return;
    }

    this.currentFilter = filter;
    this.applyFilter();

    setTimeout(() => this.todoListComponent?.animateFilterSwitch());
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.saveTheme();
    this.applyTheme();
    this.animateThemeToggle();
  }

  private applyFilter(): void {
    switch (this.currentFilter) {
      case 'completed':
        this.filteredTasks = this.tasks.filter(task => task.completed);
        break;
      case 'pending':
        this.filteredTasks = this.tasks.filter(task => !task.completed);
        break;
      default:
        this.filteredTasks = [...this.tasks];
    }
  }

  private updateStats(): void {
    this.totalCount = this.tasks.length;
    this.completedCount = this.tasks.filter(task => task.completed).length;
    this.pendingCount = this.tasks.filter(task => !task.completed).length;
  }

  private animateAppLoad(): void {
    if (this.headerRef) {
      gsap.from(this.headerRef.nativeElement, {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: 'power3.out',
      });
    }

    if (this.addTodoRef) {
      gsap.from(this.addTodoRef.nativeElement, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out',
      });
    }
  }

  private animateThemeToggle(): void {
    gsap.to('body', {
      duration: 0.6,
      ease: 'power2.inOut',
    });
  }

  private saveTheme(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  private loadTheme(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem('darkMode');
      if (!saved) {
        return;
      }

      this.isDarkMode = JSON.parse(saved);
      this.applyTheme();
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }

  private applyTheme(): void {
    const root = document.documentElement;

    if (this.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private clearError(): void {
    this.errorMessage = null;
  }

  private handleError(error: unknown): void {
    console.error('Todo action error:', error);
    this.errorMessage =
      error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}
