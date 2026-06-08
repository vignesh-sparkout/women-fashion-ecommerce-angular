import { computed, Injectable, signal } from '@angular/core';
import { categoryGroups, products, recentOrders } from '../../shared/models/catalog.data';
import { CartItem, Product } from '../../shared/models/product';

@Injectable({ providedIn: 'root' })
export class ShopService {
  readonly products = products;
  readonly categoryGroups = categoryGroups;
  readonly recentOrders = recentOrders;

  private readonly cartItems = signal<CartItem[]>([]);
  private readonly wishlistIds = signal<Set<number>>(new Set([2, 5, 8]));

  readonly cart = this.cartItems.asReadonly();
  readonly wishlist = computed(() =>
    this.products.filter((product) => this.wishlistIds().has(product.id))
  );
  readonly cartCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  readonly cartTotal = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.product.discountPrice * item.quantity,
      0
    )
  );
  readonly wishlistCount = computed(() => this.wishlistIds().size);

  getProductById(id: number): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  relatedProducts(product: Product): Product[] {
    return this.products
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 4);
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistIds().has(productId);
  }

  toggleWishlist(productId: number): void {
    const ids = new Set(this.wishlistIds());

    if (ids.has(productId)) {
      ids.delete(productId);
    } else {
      ids.add(productId);
    }

    this.wishlistIds.set(ids);
  }

  addToCart(product: Product, size: string, color: string, quantity = 1): void {
    const items = this.cartItems();
    const existing = items.find(
      (item) => item.product.id === product.id && item.size === size && item.color === color
    );

    if (existing) {
      this.cartItems.set(
        items.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
      return;
    }

    this.cartItems.set([...items, { product, size, color, quantity }]);
  }

  updateQuantity(productId: number, size: string, color: string, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(productId, size, color);
      return;
    }

    this.cartItems.set(
      this.cartItems().map((item) =>
        item.product.id === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  }

  removeFromCart(productId: number, size: string, color: string): void {
    this.cartItems.set(
      this.cartItems().filter(
        (item) =>
          item.product.id !== productId || item.size !== size || item.color !== color
      )
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }
}
