import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {
  readonly shop = inject(ShopService);
  readonly deliveryFee = computed(() => (this.shop.cartTotal() > 3000 || this.shop.cartCount() === 0 ? 0 : 199));
  readonly grandTotal = computed(() => this.shop.cartTotal() + this.deliveryFee());

  updateQuantity(productId: number, size: string, color: string, quantity: string): void {
    this.shop.updateQuantity(productId, size, color, Number(quantity));
  }

  remove(productId: number, size: string, color: string): void {
    this.shop.removeFromCart(productId, size, color);
  }
}
