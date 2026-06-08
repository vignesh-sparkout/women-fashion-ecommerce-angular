import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-orders',
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {
  readonly shop = inject(ShopService);
}
