import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories {
  readonly shop = inject(ShopService);
}
