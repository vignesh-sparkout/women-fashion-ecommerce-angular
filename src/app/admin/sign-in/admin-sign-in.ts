import { Component, OnDestroy, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-sign-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-sign-in.html',
  styleUrl: './admin-sign-in.css'
})
export class AdminSignIn implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminAuth = inject(AdminAuthService);

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin/dashboard';
  readonly adminForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitted = false;
  message = '';
  popupTitle = '';
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';

  private popupTimer: ReturnType<typeof setTimeout> | null = null;
  private navigationTimer: ReturnType<typeof setTimeout> | null = null;

  signIn(): void {
    this.submitted = true;
    this.message = '';

    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      this.showPopup('Check details', 'Please enter the admin email and password.', 'error');
      return;
    }

    const value = this.adminForm.getRawValue();
    const result = this.adminAuth.signIn(value.email, value.password);

    if (!result.success) {
      this.message = result.message;
      this.showPopup('Admin sign in failed', result.message, 'error');
      return;
    }

    this.showPopup('Admin verified', result.message, 'success');
    this.navigationTimer = setTimeout(() => this.router.navigateByUrl(this.returnUrl), 900);
  }

  ngOnDestroy(): void {
    this.clearPopupTimer();

    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
    }
  }

  emailInvalid(): boolean {
    return this.showError(this.adminForm.controls.email);
  }

  passwordInvalid(): boolean {
    return this.showError(this.adminForm.controls.password);
  }

  emailError(): string {
    const email = this.adminForm.controls.email;

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
    const password = this.adminForm.controls.password;

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
    return control.invalid && (control.touched || this.submitted);
  }

  private showPopup(title: string, message: string, type: 'success' | 'error'): void {
    this.clearPopupTimer();
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupType = type;
    this.popupTimer = setTimeout(() => {
      this.popupMessage = '';
    }, 2600);
  }

  private clearPopupTimer(): void {
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
      this.popupTimer = null;
    }
  }
}
