import { Component, OnDestroy, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-register.html',
  styleUrl: './user-register.css',
})
export class UserRegister implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/products';
  readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  submitted = false;
  message = '';
  popupTitle = signal('');
  popupMessage = signal('');
  popupType = signal<'success' | 'error'>('success');

  private popupTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationTimer: ReturnType<typeof setTimeout> | null = null;

  createAccount(): void {
    this.submitted = true;
    this.message = '';

    if (this.registerForm.invalid || this.passwordsDoNotMatch()) {
      this.registerForm.markAllAsTouched();
      this.showPopup(
        'Check details',
        'Please complete all fields correctly before creating an account.',
        'error',
      );
      return;
    }

    const value = this.registerForm.getRawValue();
    const result = this.authService.register(value.fullName, value.email, value.password);

    if (!result.success) {
      this.message = result.message;
      this.showPopup('Registration failed', result.message, 'error');
      return;
    }

    this.showPopup('Account created', 'Redirecting you to sign in.', 'success');
    this.navigationTimer = setTimeout(() => {
      this.router.navigate(['/auth'], {
        queryParams: {
          registered: true,
          returnUrl: this.returnUrl,
        },
      });
    }, 900);
  }

  ngOnDestroy(): void {
    this.clearPopupTimer();

    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
    }
  }

  passwordsDoNotMatch(): boolean {
    const value = this.registerForm.getRawValue();
    return Boolean(
      value.password && value.confirmPassword && value.password !== value.confirmPassword,
    );
  }

  fullNameInvalid(): boolean {
    return this.showError(this.registerForm.controls.fullName);
  }

  emailInvalid(): boolean {
    return this.showError(this.registerForm.controls.email);
  }

  passwordInvalid(): boolean {
    return this.showError(this.registerForm.controls.password);
  }

  confirmPasswordInvalid(): boolean {
    const confirmPassword = this.registerForm.controls.confirmPassword;
    return this.showError(confirmPassword) || this.showMismatchError(confirmPassword);
  }

  fullNameError(): string {
    const fullName = this.registerForm.controls.fullName;

    if (!this.showError(fullName)) {
      return '';
    }

    if (fullName.hasError('required')) {
      return 'Enter your full name.';
    }

    if (fullName.hasError('minlength')) {
      return 'Full name must be at least 2 characters.';
    }

    return '';
  }

  emailError(): string {
    const email = this.registerForm.controls.email;

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
    const password = this.registerForm.controls.password;

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

  confirmPasswordError(): string {
    const confirmPassword = this.registerForm.controls.confirmPassword;

    if (!this.showError(confirmPassword) && !this.showMismatchError(confirmPassword)) {
      return '';
    }

    if (confirmPassword.hasError('required')) {
      return 'Confirm password is required.';
    }

    if (confirmPassword.hasError('minlength')) {
      return 'Confirm password must be at least 6 characters.';
    }

    if (this.passwordsDoNotMatch()) {
      return 'Password and confirm password must match.';
    }

    return '';
  }

  private showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted);
  }

  private showMismatchError(control: AbstractControl): boolean {
    return this.passwordsDoNotMatch() && (control.touched || this.submitted);
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
