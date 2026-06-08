import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  readonly shop = inject(ShopService);
  private readonly fb = inject(FormBuilder);

  readonly heroImage =
    'linear-gradient(90deg, rgba(31, 41, 55, 0.82), rgba(31, 41, 55, 0.24)), url("https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=80")';
  readonly newsletterForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });
  readonly newArrivals = computed(() => this.shop.products.filter((item) => item.isNew).slice(0, 4));
  readonly bestSellers = computed(() =>
    this.shop.products.filter((item) => item.isBestSeller).slice(0, 4)
  );

  subscribed = false;

  joinNewsletter(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }

    this.subscribed = true;
    this.newsletterForm.reset();
  }
}
