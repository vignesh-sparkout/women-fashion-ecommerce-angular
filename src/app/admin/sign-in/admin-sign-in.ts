import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-sign-in',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-sign-in.html',
  styleUrl: './admin-sign-in.css'
})
export class AdminSignIn {
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

  signIn(): void {
    this.submitted = true;
    this.message = '';

    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const value = this.adminForm.getRawValue();
    const result = this.adminAuth.signIn(value.email, value.password);

    if (!result.success) {
      this.message = result.message;
      return;
    }

    this.router.navigateByUrl(this.returnUrl);
  }
}
