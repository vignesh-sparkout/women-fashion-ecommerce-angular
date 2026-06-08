import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-sign-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-sign-in.html',
  styleUrl: './user-sign-in.css'
})
export class UserSignIn {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/products';
  readonly registeredEmail = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly registrationDone = this.route.snapshot.queryParamMap.get('registered') === 'true';

  readonly loginForm = this.fb.nonNullable.group({
    email: [this.registeredEmail, [Validators.required, Validators.email, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loginSubmitted = false;
  loginMessage = '';

  signIn(): void {
    this.loginSubmitted = true;
    this.loginMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const value = this.loginForm.getRawValue();
    const result = this.authService.signIn(value.email, value.password);

    if (!result.success) {
      this.loginMessage = result.message;
      return;
    }

    this.loginSubmitted = false;
    this.router.navigateByUrl(this.returnUrl);
  }

  emailInvalid(): boolean {
    return this.showError(this.loginForm.controls.email);
  }

  passwordInvalid(): boolean {
    return this.showError(this.loginForm.controls.password);
  }

  emailError(): string {
    const email = this.loginForm.controls.email;

    if (!this.showError(email)) {
      return '';
    }

    if (email.hasError('required')) {
      return 'Email is required.';
    }

    if (email.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (email.hasError('minlength')) {
      return 'Email must be at least 5 characters.';
    }

    return '';
  }

  passwordError(): string {
    const password = this.loginForm.controls.password;

    if (!this.showError(password)) {
      return '';
    }

    if (password.hasError('required')) {
      return 'Password is required.';
    }

    if (password.hasError('minlength')) {
      return 'Password must be at least 6 characters.';
    }

    return '';
  }

  private showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.loginSubmitted);
  }
}
