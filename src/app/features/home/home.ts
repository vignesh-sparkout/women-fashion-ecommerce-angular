import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  readonly shop = inject(ShopService);

  readonly heroImage =
    'linear-gradient(90deg, rgba(31, 41, 55, 0.82), rgba(31, 41, 55, 0.24)), url("https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=80")';
  readonly newArrivals = computed(() => this.shop.products.filter((item) => item.isNew).slice(0, 4));
  readonly bestSellers = computed(() =>
    this.shop.products.filter((item) => item.isBestSeller).slice(0, 4)
  );
}
