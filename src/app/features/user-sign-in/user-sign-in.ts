import { Component, OnDestroy, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-sign-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-sign-in.html',
  styleUrl: './user-sign-in.css',
})
export class UserSignIn implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/products';
  readonly registrationDone = this.route.snapshot.queryParamMap.get('registered') === 'true';

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loginSubmitted = false;
  errorMessage = '';
  popupTitle = signal('');
  popupMessage = signal('');
  popupType = signal<'success' | 'error'>('success');

  private popupTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (this.authService.isSignedIn()) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    if (this.registrationDone) {
      this.showPopup(
        'Account created',
        'Please type your email and password to sign in.',
        'success',
      );
    }
  }

  signIn(): void {
    this.loginSubmitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.showPopup('Check details', 'Please enter a valid email and password.', 'error');
      return;
    }

    const value = this.loginForm.getRawValue();
    const result = this.authService.signIn(value.email, value.password);

    if (!result.success) {
      this.errorMessage = result.message;
      this.showPopup('Sign in failed', result.message, 'error');
      return;
    }

    this.loginSubmitted = false;
    this.showPopup('Welcome back', result.message, 'success');
    this.navigationTimer = setTimeout(() => this.router.navigateByUrl(this.returnUrl), 900);
  }

  ngOnDestroy(): void {
    this.clearPopupTimer();

    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
    }
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

  private showPopup(title: string, message: string, type: 'success' | 'error'): void {
    this.clearPopupTimer();
    this.popupTitle.set(title);
    this.popupMessage.set(message);
    this.popupType.set(type);
    this.popupTimer = setTimeout(() => this.hidePopup(), 2600);
  }

  private hidePopup(): void {
    this.clearPopupTimer();
    this.popupTitle.set('');
    this.popupMessage.set('');
    this.popupType.set('success');
  }

  private clearPopupTimer(): void {
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
      this.popupTimer = null;
    }
  }
}
