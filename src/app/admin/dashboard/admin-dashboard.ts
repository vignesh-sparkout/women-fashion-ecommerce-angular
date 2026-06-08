import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard {
  readonly shop = inject(ShopService);
  readonly totalOrders = this.shop.recentOrders.length;
  readonly totalProducts = this.shop.products.length;
  readonly totalRevenue = this.shop.recentOrders.reduce((sum, order) => sum + order.total, 0);
}
