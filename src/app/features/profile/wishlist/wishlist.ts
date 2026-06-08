import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'app-wishlist',
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class Wishlist {
  readonly shop = inject(ShopService);

  remove(productId: number): void {
    this.shop.toggleWishlist(productId);
  }
}
