import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { gsap } from 'gsap';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.css'],
})
export class TodoItemComponent implements AfterViewInit, OnChanges {
  @Input() task!: Task;
  @Output() toggle = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() update = new EventEmitter<{ id: string; text: string }>();

  @ViewChild('itemCard', { static: true }) itemCard!: ElementRef<HTMLElement>;

  editing = false;
  editText = '';
  private hasAnimated = false;
  private animationTween: gsap.core.Tween | null = null;

  ngAfterViewInit(): void {
    // Don't auto-animate on init - let the parent control animations
    // This prevents double animations when items are added
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && !changes['task'].firstChange && this.editing) {
      this.editText = this.task.text;
    }
  }

  animateEntrance(delay = 0): void {
    if (!this.itemCard || this.hasAnimated) {
      return;
    }

    // Kill any existing animation
    if (this.animationTween) {
      this.animationTween.kill();
    }

    // Reset initial state
    gsap.set(this.itemCard.nativeElement, { opacity: 0, y: -30 });

    this.animationTween = gsap.to(this.itemCard.nativeElement, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      delay,
      onComplete: () => {
        this.hasAnimated = true;
        this.animationTween = null;
      },
    });
  }

  animateFilterEntrance(delay = 0): void {
    if (!this.itemCard) {
      return;
    }

    // Kill any existing animation
    if (this.animationTween) {
      this.animationTween.kill();
    }

    // Reset initial state
    gsap.set(this.itemCard.nativeElement, { opacity: 0, y: 20 });

    this.animationTween = gsap.to(this.itemCard.nativeElement, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
      delay,
      onComplete: () => {
        this.animationTween = null;
      },
    });
  }

  onToggle(): void {
    this.toggle.emit(this.task.id);
  }

  startEdit(): void {
    this.editing = true;
    this.editText = this.task.text;
  }

  saveEdit(): void {
    const trimmed = this.editText.trim();
    if (!trimmed) {
      this.cancelEdit();
      return;
    }

    if (trimmed !== this.task.text) {
      this.update.emit({ id: this.task.id, text: trimmed });
    }

    this.editing = false;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editText = '';
  }

  onDelete(): void {
    if (this.itemCard) {
      // Kill any existing animation
      if (this.animationTween) {
        this.animationTween.kill();
      }

      this.animationTween = gsap.to(this.itemCard.nativeElement, {
        opacity: 0,
        x: -100,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          this.animationTween = null;
          this.delete.emit(this.task.id);
        },
      });
    } else {
      this.delete.emit(this.task.id);
    }
  }
}
