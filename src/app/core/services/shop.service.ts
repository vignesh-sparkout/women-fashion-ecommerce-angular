import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { categoryGroups, products } from '../../shared/models/catalog.data';
import { CartItem, CustomerOrder, Product, ShippingAddress } from '../../shared/models/product';

const userWishlistKey = 'velora_user_wishlists';
const userAddressKey = 'velora_user_addresses';
const userOrdersKey = 'velora_user_orders';

interface PlaceOrderInput {
  shippingAddress: ShippingAddress;
  paymentMethod: CustomerOrder['paymentMethod'];
  deliveryFee: number;
  couponDiscount: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly auth = inject(AuthService);

  readonly products = products;
  readonly categoryGroups = categoryGroups;

  private readonly cartItems = signal<CartItem[]>([]);
  private readonly wishlistIds = signal<Set<number>>(new Set());
  private readonly savedAddressSignal = signal<ShippingAddress | null>(null);
  private readonly userOrdersSignal = signal<CustomerOrder[]>([]);
  private readonly allOrdersSignal = signal<CustomerOrder[]>(this.readAllOrders());

  readonly cart = this.cartItems.asReadonly();
  readonly savedAddress = this.savedAddressSignal.asReadonly();
  readonly userOrders = this.userOrdersSignal.asReadonly();
  readonly allOrders = this.allOrdersSignal.asReadonly();
  readonly wishlist = computed(() =>
    this.products.filter((product) => this.wishlistIds().has(product.id)),
  );
  readonly cartCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0),
  );
  readonly cartTotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.product.discountPrice * item.quantity, 0),
  );
  readonly wishlistCount = computed(() => this.wishlistIds().size);

  constructor() {
    effect(() => {
      const email = this.auth.currentUser()?.email;

      this.wishlistIds.set(this.readWishlist(email));
      this.savedAddressSignal.set(this.readAddress(email));
      this.userOrdersSignal.set(this.readOrders(email));
    });
  }

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
    const user = this.auth.currentUser();

    if (!user) {
      this.wishlistIds.set(new Set());
      return;
    }

    const ids = new Set(this.wishlistIds());

    if (ids.has(productId)) {
      ids.delete(productId);
    } else {
      ids.add(productId);
    }

    this.wishlistIds.set(ids);
    this.saveWishlist(user.email, ids);
  }

  addToCart(product: Product, size: string, color: string, quantity = 1): void {
    const items = this.cartItems();
    const existing = items.find(
      (item) => item.product.id === product.id && item.size === size && item.color === color,
    );

    if (existing) {
      this.cartItems.set(
        items.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item,
        ),
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
          : item,
      ),
    );
  }

  removeFromCart(productId: number, size: string, color: string): void {
    this.cartItems.set(
      this.cartItems().filter(
        (item) => item.product.id !== productId || item.size !== size || item.color !== color,
      ),
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  saveAddress(address: ShippingAddress): void {
    const user = this.auth.currentUser();

    if (!user) {
      return;
    }

    const cleanAddress = this.normalizeAddress(address);
    const addressesByUser = this.readAddressByUser();

    addressesByUser[this.normalizeEmail(user.email)] = cleanAddress;
    this.writeAddressByUser(addressesByUser);
    this.savedAddressSignal.set(cleanAddress);
  }

  placeOrder(orderInput: PlaceOrderInput): CustomerOrder | null {
    const user = this.auth.currentUser();
    const items = this.cartItems();

    if (!user || items.length === 0) {
      return null;
    }

    const shippingAddress = this.normalizeAddress(orderInput.shippingAddress);
    const order: CustomerOrder = {
      id: this.createOrderId(),
      customer: shippingAddress.fullName || user.fullName,
      customerEmail: user.email,
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        image: item.product.image,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.product.discountPrice,
      })),
      shippingAddress,
      paymentMethod: orderInput.paymentMethod,
      subtotal: this.cartTotal(),
      deliveryFee: orderInput.deliveryFee,
      couponDiscount: orderInput.couponDiscount,
      total: orderInput.total,
      status: 'Packed',
      date: this.formatOrderDate(new Date()),
      createdAt: Date.now(),
    };

    const ordersByUser = this.readOrdersByUser();
    const key = this.normalizeEmail(user.email);
    const userOrders = [order, ...(ordersByUser[key] ?? [])];

    ordersByUser[key] = userOrders;
    this.writeOrdersByUser(ordersByUser);
    this.saveAddress(shippingAddress);
    this.userOrdersSignal.set(userOrders);
    this.allOrdersSignal.set(this.flattenOrders(ordersByUser));
    this.clearCart();

    return order;
  }

  private readWishlist(email: string | undefined): Set<number> {
    if (!email) {
      return new Set();
    }

    const wishlistByUser = this.readWishlistByUser();
    return new Set(wishlistByUser[this.normalizeEmail(email)] ?? []);
  }

  private saveWishlist(email: string, ids: Set<number>): void {
    const wishlistByUser = this.readWishlistByUser();
    const key = this.normalizeEmail(email);

    if (ids.size === 0) {
      delete wishlistByUser[key];
    } else {
      wishlistByUser[key] = [...ids];
    }

    this.writeWishlistByUser(wishlistByUser);
  }

  private readWishlistByUser(): Record<string, number[]> {
    try {
      const value = localStorage.getItem(userWishlistKey);
      return value ? (JSON.parse(value) as Record<string, number[]>) : {};
    } catch {
      return {};
    }
  }

  private writeWishlistByUser(wishlistByUser: Record<string, number[]>): void {
    try {
      localStorage.setItem(userWishlistKey, JSON.stringify(wishlistByUser));
    } catch {
      return;
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private readAddress(email: string | undefined): ShippingAddress | null {
    if (!email) {
      return null;
    }

    return this.readAddressByUser()[this.normalizeEmail(email)] ?? null;
  }

  private readAddressByUser(): Record<string, ShippingAddress> {
    try {
      const value = localStorage.getItem(userAddressKey);
      return value ? (JSON.parse(value) as Record<string, ShippingAddress>) : {};
    } catch {
      return {};
    }
  }

  private writeAddressByUser(addressesByUser: Record<string, ShippingAddress>): void {
    try {
      localStorage.setItem(userAddressKey, JSON.stringify(addressesByUser));
    } catch {
      return;
    }
  }

  private readOrders(email: string | undefined): CustomerOrder[] {
    if (!email) {
      return [];
    }

    return this.readOrdersByUser()[this.normalizeEmail(email)] ?? [];
  }

  private readAllOrders(): CustomerOrder[] {
    return this.flattenOrders(this.readOrdersByUser());
  }

  private readOrdersByUser(): Record<string, CustomerOrder[]> {
    try {
      const value = localStorage.getItem(userOrdersKey);
      return value ? (JSON.parse(value) as Record<string, CustomerOrder[]>) : {};
    } catch {
      return {};
    }
  }

  private writeOrdersByUser(ordersByUser: Record<string, CustomerOrder[]>): void {
    try {
      localStorage.setItem(userOrdersKey, JSON.stringify(ordersByUser));
    } catch {
      return;
    }
  }

  private flattenOrders(ordersByUser: Record<string, CustomerOrder[]>): CustomerOrder[] {
    return Object.values(ordersByUser)
      .flat()
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  private normalizeAddress(address: ShippingAddress): ShippingAddress {
    return {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      email: this.normalizeEmail(address.email),
      address: address.address.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pinCode: address.pinCode.trim(),
    };
  }

  private createOrderId(): string {
    return `ORD-${Date.now().toString().slice(-6)}`;
  }

  private formatOrderDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
