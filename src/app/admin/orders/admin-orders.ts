import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders {
  readonly shop = inject(ShopService);
}
