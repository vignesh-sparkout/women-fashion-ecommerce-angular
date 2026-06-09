import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { CustomerOrder, ShippingAddress } from '../../shared/models/product';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  readonly shop = inject(ShopService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly checkoutForm = this.fb.nonNullable.group({
    shipping: this.fb.nonNullable.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pinCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    }),
    payment: this.fb.nonNullable.group({
      method: ['upi', Validators.required],
      coupon: [''],
    }),
  });

  readonly deliveryFee = computed(() =>
    this.shop.cartTotal() > 3000 || this.shop.cartCount() === 0 ? 0 : 199,
  );

  submitted = false;
  orderPlaced = false;
  lastOrderId = '';
  popupTitle = signal('');
  popupMessage = signal('');

  private popupTimer: ReturnType<typeof setTimeout> | null = null;

  couponDiscount(): number {
    const coupon = this.checkoutForm.controls.payment.controls.coupon.value.trim().toUpperCase();
    return coupon === 'VELORA10' ? Math.round(this.shop.cartTotal() * 0.1) : 0;
  }

  grandTotal(): number {
    return Math.max(this.shop.cartTotal() + this.deliveryFee() - this.couponDiscount(), 0);
  }

  constructor() {
    effect(() => {
      this.prefillShippingDetails(this.shop.savedAddress());
    });
  }

  placeOrder(): void {
    this.submitted = true;

    if (this.checkoutForm.invalid || this.shop.cartCount() === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const value = this.checkoutForm.getRawValue();
    const order = this.shop.placeOrder({
      shippingAddress: value.shipping,
      paymentMethod: value.payment.method as CustomerOrder['paymentMethod'],
      deliveryFee: this.deliveryFee(),
      couponDiscount: this.couponDiscount(),
      total: this.grandTotal(),
    });

    if (!order) {
      return;
    }

    this.lastOrderId = order.id;
    this.orderPlaced = true;
    this.showPopup('Order placed', `Your order ${order.id} was placed successfully.`);
    this.checkoutForm.controls.payment.reset({
      method: 'upi',
      coupon: '',
    });
    this.prefillShippingDetails(order.shippingAddress);
    this.submitted = false;
  }

  ngOnDestroy(): void {
    this.clearPopupTimer();
  }

  private prefillShippingDetails(savedAddress: ShippingAddress | null): void {
    const user = this.auth.currentUser();

    this.checkoutForm.controls.shipping.patchValue({
      fullName: savedAddress?.fullName ?? user?.fullName ?? '',
      phone: savedAddress?.phone ?? '',
      email: savedAddress?.email ?? user?.email ?? '',
      address: savedAddress?.address ?? '',
      city: savedAddress?.city ?? '',
      state: savedAddress?.state ?? '',
      pinCode: savedAddress?.pinCode ?? '',
    });
  }

  private showPopup(title: string, message: string): void {
    this.clearPopupTimer();
    this.popupTitle.set(title);
    this.popupMessage.set(message);
    this.popupTimer = setTimeout(() => this.hidePopup(), 2800);
  }

  private hidePopup(): void {
    this.clearPopupTimer();
    this.popupTitle.set('');
    this.popupMessage.set('');
  }

  private clearPopupTimer(): void {
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
      this.popupTimer = null;
    }
  }
}
