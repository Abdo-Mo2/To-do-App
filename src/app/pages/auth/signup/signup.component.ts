import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  error: string | null = null;
  loading = false;
  form: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue() as { displayName: string; email: string; password: string; confirmPassword: string };
    const { password, confirmPassword, displayName, email } = formValue;
    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      await this.authService.signUp(email, password, displayName);
      this.router.navigateByUrl('/app');
    } catch (err: any) {
      this.error = this.authService.getErrorMessage(err);
    } finally {
      this.loading = false;
    }
  }
}
