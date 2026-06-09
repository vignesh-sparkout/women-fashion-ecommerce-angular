import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly shop = inject(ShopService);

  private readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('id')) },
  );

  readonly product = computed(
    () => this.shop.getProductById(this.productId()) ?? this.shop.products[0],
  );
  readonly relatedProducts = computed(() => this.shop.relatedProducts(this.product()));
  readonly purchaseForm = this.fb.nonNullable.group({
    size: [this.product().sizes[0], Validators.required],
    color: [this.product().colors[0], Validators.required],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  addedToCart = false;

  constructor() {
    effect(() => {
      const product = this.product();

      this.purchaseForm.reset({
        size: product.sizes[0],
        color: product.colors[0],
        quantity: 1,
      });
      this.addedToCart = false;
    });
  }

  addToCart(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    const value = this.purchaseForm.getRawValue();
    this.shop.addToCart(this.product(), value.size, value.color, value.quantity);
    this.addedToCart = true;
  }

  buyNow(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    const value = this.purchaseForm.getRawValue();
    this.shop.addToCart(this.product(), value.size, value.color, value.quantity);
    this.addedToCart = true;

    if (!this.auth.isSignedIn()) {
      this.router.navigate(['/auth'], {
        queryParams: {
          returnUrl: '/checkout',
        },
      });
      return;
    }

    this.router.navigate(['/checkout']);
  }
}
