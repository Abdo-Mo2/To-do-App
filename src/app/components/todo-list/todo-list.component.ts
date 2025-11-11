import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { FilterType, Task } from '../../models/task.model';
import { TodoItemComponent } from '../todo-item/todo-item.component';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
})
export class TodoListComponent implements OnChanges, AfterViewInit {
  @Input() tasks: Task[] = [];
  @Input() currentFilter: FilterType = 'all';

  @Output() toggleTask = new EventEmitter<string>();
  @Output() deleteTask = new EventEmitter<string>();
  @Output() updateTask = new EventEmitter<{ id: string; text: string }>();

  @ViewChildren(TodoItemComponent) todoItemComponents!: QueryList<TodoItemComponent>;

  private initialized = false;
  private previousTaskIds = new Set<string>();

  ngAfterViewInit(): void {
    this.initialized = true;
    this.previousTaskIds = new Set(this.tasks.map(task => task.id));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] && this.initialized) {
      this.handleNewTasks();
    }
  }

  animateFilterSwitch(): void {
    if (!this.todoItemComponents || this.todoItemComponents.length === 0) {
      return;
    }

    const components = this.todoItemComponents.toArray();
    components.forEach((component, index) => {
      component.animateFilterEntrance(index * 0.05);
    });
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  onToggleTask(id: string): void {
    this.toggleTask.emit(id);
  }

  onDeleteTask(id: string): void {
    this.deleteTask.emit(id);
  }

  onUpdateTask(update: { id: string; text: string }): void {
    this.updateTask.emit(update);
  }

  private handleNewTasks(): void {
    const currentIds = new Set(this.tasks.map(task => task.id));
    const addedIds = this.tasks
      .filter(task => !this.previousTaskIds.has(task.id))
      .map(task => task.id);

    this.previousTaskIds = currentIds;

    if (!addedIds.length) {
      return;
    }

    // Wait for Angular to render the new components
    setTimeout(() => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const components = this.todoItemComponents?.toArray() || [];
        components.forEach((component, index) => {
          if (addedIds.includes(component.task.id)) {
            // Only animate the newly added task
            component.animateEntrance(index * 0.05);
          }
        });
      });
    }, 50);
  }
}
