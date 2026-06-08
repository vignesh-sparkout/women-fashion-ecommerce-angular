import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {
  readonly shop = inject(ShopService);
  private readonly fb = inject(FormBuilder);

  readonly checkoutForm = this.fb.nonNullable.group({
    shipping: this.fb.nonNullable.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pinCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    }),
    payment: this.fb.nonNullable.group({
      method: ['upi', Validators.required],
      coupon: ['']
    })
  });

  readonly deliveryFee = computed(() => (this.shop.cartTotal() > 3000 || this.shop.cartCount() === 0 ? 0 : 199));

  submitted = false;
  orderPlaced = false;

  couponDiscount(): number {
    const coupon = this.checkoutForm.controls.payment.controls.coupon.value.trim().toUpperCase();
    return coupon === 'VELORA10' ? Math.round(this.shop.cartTotal() * 0.1) : 0;
  }

  grandTotal(): number {
    return Math.max(this.shop.cartTotal() + this.deliveryFee() - this.couponDiscount(), 0);
  }

  placeOrder(): void {
    this.submitted = true;

    if (this.checkoutForm.invalid || this.shop.cartCount() === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.orderPlaced = true;
    this.shop.clearCart();
    this.checkoutForm.reset({
      shipping: {
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pinCode: ''
      },
      payment: {
        method: 'upi',
        coupon: ''
      }
    });
    this.submitted = false;
  }
}
