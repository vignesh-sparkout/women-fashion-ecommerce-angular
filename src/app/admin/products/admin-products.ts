import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-admin-products',
  imports: [CommonModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css'
})
export class AdminProducts {
  readonly shop = inject(ShopService);
}
