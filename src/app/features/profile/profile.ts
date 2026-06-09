import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';

type AccountField =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'addressLine1'
  | 'city'
  | 'state'
  | 'pinCode'
  | 'country';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  readonly shop = inject(ShopService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly user = this.auth.currentUser();

  readonly stateOptions = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  readonly accountForm = this.fb.nonNullable.group({
    fullName: [this.user?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
    email: [
      this.user?.email ?? '',
      [Validators.required, Validators.email, Validators.minLength(5)],
    ],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pinCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    country: ['India', Validators.required],
    defaultAddress: [true],
  });

  submitted = false;
  saveSucceeded = false;
  saveMessage = '';

  private readonly fieldLabels: Record<AccountField, string> = {
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone number',
    addressLine1: 'Address line 1',
    city: 'City',
    state: 'State',
    pinCode: 'Postal code',
    country: 'Country',
  };

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const savedAddress = this.shop.savedAddress();
      const savedAddressLines = this.splitAddress(savedAddress?.address ?? '');

      this.accountForm.patchValue({
        fullName: savedAddress?.fullName ?? user?.fullName ?? '',
        email: savedAddress?.email ?? user?.email ?? '',
        phone: savedAddress?.phone ?? '',
        addressLine1: savedAddressLines.line1,
        addressLine2: savedAddressLines.line2,
        city: savedAddress?.city ?? '',
        state: savedAddress?.state ?? '',
        pinCode: savedAddress?.pinCode ?? '',
        country: 'India',
        defaultAddress: true,
      });
    });
  }

  saveDetails(): void {
    this.submitted = true;
    this.saveMessage = '';

    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.saveSucceeded = false;
      return;
    }

    const value = this.accountForm.getRawValue();
    const result = this.auth.updateProfile(value.fullName, value.email);

    if (!result.success) {
      this.saveSucceeded = false;
      this.saveMessage = result.message;
      return;
    }

    this.shop.saveAddress({
      fullName: value.fullName,
      email: value.email,
      phone: value.phone,
      address: this.combineAddress(value.addressLine1, value.addressLine2),
      city: value.city,
      state: value.state,
      pinCode: value.pinCode,
    });

    this.submitted = false;
    this.saveSucceeded = true;
    this.saveMessage = 'Profile and address saved.';
  }

  controlInvalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted);
  }

  fieldError(field: AccountField): string {
    const control = this.accountForm.controls[field];

    if (!this.controlInvalid(control)) {
      return '';
    }

    if (control.hasError('required')) {
      return `${this.fieldLabels[field]} is required.`;
    }

    if (field === 'fullName' && control.hasError('minlength')) {
      return 'Full name must be at least 2 characters.';
    }

    if (field === 'email' && control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (field === 'email' && control.hasError('minlength')) {
      return 'Email must be at least 5 characters.';
    }

    if (field === 'phone' && control.hasError('pattern')) {
      return 'Enter a 10 digit phone number.';
    }

    if (field === 'pinCode' && control.hasError('pattern')) {
      return 'Enter a 6 digit postal code.';
    }

    return '';
  }

  private combineAddress(addressLine1: string, addressLine2: string): string {
    return [addressLine1.trim(), addressLine2.trim()].filter(Boolean).join('\n');
  }

  private splitAddress(address: string): { line1: string; line2: string } {
    const [line1 = '', ...rest] = address.split('\n');

    return {
      line1,
      line2: rest.join('\n'),
    };
  }
}
