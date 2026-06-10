import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories {
  readonly shop = inject(ShopService);

  updateCategoryName(index: number, event: Event): void {
    this.shop.updateCategory(index, { name: this.textValue(event) });
  }

  updateCategoryDescription(index: number, event: Event): void {
    this.shop.updateCategory(index, { description: this.textValue(event) });
  }

  updateCategoryImage(index: number, event: Event): void {
    this.shop.updateCategory(index, { image: this.textValue(event) });
  }

  updateSubCategory(categoryIndex: number, childIndex: number, event: Event): void {
    this.shop.updateSubCategory(categoryIndex, childIndex, this.textValue(event));
  }

  addSubCategory(categoryIndex: number): void {
    this.shop.addSubCategory(categoryIndex);
  }

  removeSubCategory(categoryIndex: number, childIndex: number): void {
    this.shop.removeSubCategory(categoryIndex, childIndex);
  }

  private textValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }
}
