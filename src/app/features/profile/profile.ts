import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['Vicky', Validators.required],
    lastName: ['Fashion', Validators.required],
    email: ['vicky@example.com', [Validators.required, Validators.email]],
    phone: ['9876543210', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });

  readonly addressForm = this.fb.nonNullable.group({
    address: ['22 Boutique Street', Validators.required],
    city: ['Ahmedabad', Validators.required],
    state: ['Gujarat', Validators.required],
    pinCode: ['380001', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
  });

  profileSaved = false;
  addressSaved = false;

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileSaved = true;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.addressSaved = true;
  }
}
