import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

type ProductTextField = 'name' | 'category' | 'subCategory';
type ProductNumberField = 'price' | 'discountPrice' | 'rating' | 'stock' | 'sold';

@Component({
  selector: 'app-admin-products',
  imports: [CommonModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts {
  readonly shop = inject(ShopService);
  readonly categoryOptions = computed(() =>
    this.shop.categoryGroups.map((category) => category.name),
  );

  subCategoryOptions(categoryName: string): string[] {
    return (
      this.shop.categoryGroups.find((category) => category.name === categoryName)?.children ?? []
    );
  }

  updateText(productId: number, field: ProductTextField, event: Event): void {
    this.shop.updateProduct(productId, { [field]: this.textValue(event) });
  }

  updateCategory(productId: number, event: Event): void {
    const category = this.textValue(event);
    const currentProduct = this.shop.getProductById(productId);
    const subCategories = this.subCategoryOptions(category);
    const subCategory =
      currentProduct && subCategories.includes(currentProduct.subCategory)
        ? currentProduct.subCategory
        : (subCategories[0] ?? '');

    this.shop.updateProduct(productId, { category, subCategory });
  }

  updateNumber(productId: number, field: ProductNumberField, event: Event): void {
    this.shop.updateProduct(productId, { [field]: this.numberValue(event) });
  }

  private textValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private numberValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }
}
