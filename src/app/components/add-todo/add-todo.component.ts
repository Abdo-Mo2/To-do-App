import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-add-todo',
  templateUrl: './add-todo.component.html',
  styleUrls: ['./add-todo.component.css'],
})
export class AddTodoComponent {
  @Output() addTask = new EventEmitter<string>();

  taskText = '';

  submit(): void {
    const trimmed = this.taskText.trim();
    if (!trimmed) {
      return;
    }

    this.addTask.emit(trimmed);
    this.taskText = '';
  }
}
