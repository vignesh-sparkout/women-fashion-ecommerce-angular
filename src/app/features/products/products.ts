import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { ShopService } from '../../core/services/shop.service';
import { Product } from '../../shared/models/product';

type SortOption = 'Newest' | 'Price Low to High' | 'Price High to Low' | 'Best Selling';

interface ProductFilters {
  search: string;
  category: string;
  maxPrice: number;
  size: string;
  color: string;
  sort: SortOption;
}

@Component({
  selector: 'app-products',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products {
  readonly shop = inject(ShopService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly categories = ['All', ...new Set(this.shop.products.map((product) => product.category))];
  readonly sizes = ['All', ...new Set(this.shop.products.flatMap((product) => product.sizes))];
  readonly colors = ['All', ...new Set(this.shop.products.flatMap((product) => product.colors))];
  readonly sortOptions: SortOption[] = [
    'Newest',
    'Price Low to High',
    'Price High to Low',
    'Best Selling'
  ];

  readonly filters = this.fb.nonNullable.group({
    search: '',
    category: this.route.snapshot.queryParamMap.get('category') ?? 'All',
    maxPrice: 10000,
    size: 'All',
    color: 'All',
    sort: 'Newest' as SortOption
  });

  private readonly filterValues = toSignal(
    this.filters.valueChanges.pipe(
      map(() => this.filters.getRawValue()),
      startWith(this.filters.getRawValue())
    ),
    { initialValue: this.filters.getRawValue() }
  );

  readonly filteredProducts = computed(() => {
    const filters = this.filterValues();
    const search = filters.search.trim().toLowerCase();
    let result = this.shop.products.filter((product) => this.matchesFilters(product, filters, search));

    if (filters.sort === 'Price Low to High') {
      result = result.sort((a, b) => a.discountPrice - b.discountPrice);
    }

    if (filters.sort === 'Price High to Low') {
      result = result.sort((a, b) => b.discountPrice - a.discountPrice);
    }

    if (filters.sort === 'Best Selling') {
      result = result.sort((a, b) => b.sold - a.sold);
    }

    if (filters.sort === 'Newest') {
      result = result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }

    return result;
  });

  resetFilters(): void {
    this.filters.setValue({
      search: '',
      category: 'All',
      maxPrice: 10000,
      size: 'All',
      color: 'All',
      sort: 'Newest'
    });
  }

  toggleWishlist(productId: number): void {
    this.shop.toggleWishlist(productId);
  }

  private matchesFilters(
    product: Product,
    filters: ProductFilters,
    search: string
  ): boolean {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.subCategory.toLowerCase().includes(search);

    return (
      matchesSearch &&
      (filters.category === 'All' || product.category === filters.category) &&
      (filters.size === 'All' || product.sizes.includes(filters.size)) &&
      (filters.color === 'All' || product.colors.includes(filters.color)) &&
      product.discountPrice <= filters.maxPrice
    );
  }
}
