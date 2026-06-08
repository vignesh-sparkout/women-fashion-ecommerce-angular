import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  readonly shop = inject(ShopService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly user = this.auth.currentUser();

  readonly profileForm = this.fb.nonNullable.group({
    fullName: [this.user?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
    email: [this.user?.email ?? '', [Validators.required, Validators.email, Validators.minLength(5)]]
  });

  readonly addressForm = this.fb.nonNullable.group({
    address: ['22 Boutique Street', Validators.required],
    city: ['Ahmedabad', Validators.required],
    state: ['Gujarat', Validators.required],
    pinCode: ['380001', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
  });

  profileSubmitted = false;
  profileSaved = false;
  profileMessage = '';
  addressSaved = false;

  saveProfile(): void {
    this.profileSubmitted = true;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    const result = this.auth.updateProfile(value.fullName, value.email);

    this.profileSaved = result.success;
    this.profileMessage = result.message;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.addressSaved = true;
  }

  fullNameInvalid(): boolean {
    return this.showProfileError(this.profileForm.controls.fullName);
  }

  emailInvalid(): boolean {
    return this.showProfileError(this.profileForm.controls.email);
  }

  fullNameError(): string {
    const fullName = this.profileForm.controls.fullName;

    if (!this.showProfileError(fullName)) {
      return '';
    }

    if (fullName.hasError('required')) {
      return 'Full name is required.';
    }

    if (fullName.hasError('minlength')) {
      return 'Full name must be at least 2 characters.';
    }

    return '';
  }

  emailError(): string {
    const email = this.profileForm.controls.email;

    if (!this.showProfileError(email)) {
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

  private showProfileError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.profileSubmitted);
  }
}
