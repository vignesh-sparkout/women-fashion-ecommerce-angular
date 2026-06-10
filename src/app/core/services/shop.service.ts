import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { categoryGroups, products } from '../../shared/models/catalog.data';
import {
  CartItem,
  CategoryGroup,
  CustomerOrder,
  Product,
  ShippingAddress,
} from '../../shared/models/product';

const userWishlistKey = 'velora_user_wishlists';
const userAddressKey = 'velora_user_addresses';
const userOrdersKey = 'velora_user_orders';
const adminProductsKey = 'velora_admin_products';
const adminCategoryGroupsKey = 'velora_admin_category_groups';

type ProductUpdate = Partial<
  Pick<
    Product,
    | 'name'
    | 'category'
    | 'subCategory'
    | 'price'
    | 'discountPrice'
    | 'rating'
    | 'sold'
    | 'stock'
    | 'isNew'
    | 'isBestSeller'
  >
>;

type CategoryUpdate = Partial<Pick<CategoryGroup, 'name' | 'description' | 'image' | 'children'>>;

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

  private readonly productsSignal = signal<Product[]>(this.readProducts());
  private readonly categoryGroupsSignal = signal<CategoryGroup[]>(this.readCategoryGroups());
  private readonly cartItems = signal<CartItem[]>([]);
  private readonly wishlistIds = signal<Set<number>>(new Set());
  private readonly savedAddressSignal = signal<ShippingAddress | null>(null);
  private readonly userOrdersSignal = signal<CustomerOrder[]>([]);
  private readonly allOrdersSignal = signal<CustomerOrder[]>(this.readAllOrders());

  get products(): Product[] {
    return this.productsSignal();
  }

  get categoryGroups(): CategoryGroup[] {
    return this.categoryGroupsSignal();
  }

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
    const currentProduct = this.getProductById(product.id) ?? product;
    const requestedQuantity = this.cleanQuantity(quantity);

    if (currentProduct.stock <= 0) {
      return;
    }

    const items = this.cartItems();
    const existing = items.find(
      (item) => item.product.id === currentProduct.id && item.size === size && item.color === color,
    );

    if (existing) {
      const nextQuantity = Math.min(existing.quantity + requestedQuantity, currentProduct.stock);

      this.cartItems.set(
        items.map((item) =>
          item === existing ? { ...item, product: currentProduct, quantity: nextQuantity } : item,
        ),
      );
      return;
    }

    this.cartItems.set([
      ...items,
      {
        product: currentProduct,
        size,
        color,
        quantity: Math.min(requestedQuantity, currentProduct.stock),
      },
    ]);
  }

  updateQuantity(productId: number, size: string, color: string, quantity: number): void {
    if (Number.isFinite(quantity) && quantity < 1) {
      this.removeFromCart(productId, size, color);
      return;
    }

    const currentProduct = this.getProductById(productId);
    const nextQuantity = currentProduct
      ? Math.min(this.cleanQuantity(quantity), currentProduct.stock)
      : this.cleanQuantity(quantity);

    if (nextQuantity < 1) {
      this.removeFromCart(productId, size, color);
      return;
    }

    this.cartItems.set(
      this.cartItems().map((item) =>
        item.product.id === productId && item.size === size && item.color === color
          ? { ...item, product: currentProduct ?? item.product, quantity: nextQuantity }
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

  updateCategory(index: number, changes: CategoryUpdate): void {
    const currentCategories = this.categoryGroups;
    const category = currentCategories[index];

    if (!category) {
      return;
    }

    const oldName = category.name;
    const updatedCategory: CategoryGroup = {
      ...category,
      ...changes,
      name: changes.name !== undefined ? changes.name : category.name,
      description:
        changes.description !== undefined ? changes.description.trimStart() : category.description,
      image: changes.image !== undefined ? changes.image.trim() : category.image,
      children:
        changes.children !== undefined ? this.cleanStringList(changes.children) : category.children,
    };
    const updatedCategories = currentCategories.map((item, itemIndex) =>
      itemIndex === index ? updatedCategory : item,
    );

    this.categoryGroupsSignal.set(updatedCategories);
    this.writeCategoryGroups(updatedCategories);

    if (changes.name !== undefined && updatedCategory.name !== oldName) {
      const updatedProducts = this.products.map((product) =>
        product.category === oldName ? { ...product, category: updatedCategory.name } : product,
      );

      this.productsSignal.set(updatedProducts);
      this.writeProducts(updatedProducts);
      this.syncCartProducts();
    }
  }

  addSubCategory(categoryIndex: number): void {
    const category = this.categoryGroups[categoryIndex];

    if (!category) {
      return;
    }

    this.updateCategory(categoryIndex, {
      children: [...category.children, 'New Subcategory'],
    });
  }

  addCategory(): void {
    const existingNames = new Set(
      this.categoryGroups.map((category) => category.name.trim().toLowerCase()),
    );
    let name = 'New Category';
    let suffix = 2;

    while (existingNames.has(name.toLowerCase())) {
      name = `New Category ${suffix}`;
      suffix += 1;
    }

    const nextCategories = [
      ...this.categoryGroups,
      {
        name,
        description: 'Curate products for this collection.',
        image:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
        children: ['New Subcategory'],
      },
    ];

    this.categoryGroupsSignal.set(nextCategories);
    this.writeCategoryGroups(nextCategories);
  }

  updateSubCategory(categoryIndex: number, childIndex: number, value: string): void {
    const category = this.categoryGroups[categoryIndex];

    if (!category || childIndex < 0 || childIndex >= category.children.length) {
      return;
    }

    const oldName = category.children[childIndex];
    const nextChildren = category.children.map((child, index) =>
      index === childIndex ? value : child,
    );

    this.updateCategory(categoryIndex, { children: nextChildren });

    if (value !== oldName) {
      const updatedProducts = this.products.map((product) =>
        product.category === category.name && product.subCategory === oldName
          ? { ...product, subCategory: value }
          : product,
      );

      this.productsSignal.set(updatedProducts);
      this.writeProducts(updatedProducts);
      this.syncCartProducts();
    }
  }

  removeSubCategory(categoryIndex: number, childIndex: number): void {
    const category = this.categoryGroups[categoryIndex];

    if (!category) {
      return;
    }

    const nextChildren = category.children.filter((_, index) => index !== childIndex);
    this.updateCategory(categoryIndex, { children: nextChildren });
  }

  updateProduct(productId: number, changes: ProductUpdate): void {
    let updatedProduct: Product | undefined;
    const updatedProducts = this.products.map((product) => {
      if (product.id !== productId) {
        return product;
      }

      updatedProduct = this.cleanProduct({ ...product, ...changes });
      return updatedProduct;
    });

    this.productsSignal.set(updatedProducts);
    this.writeProducts(updatedProducts);

    if (updatedProduct) {
      this.syncCartProduct(updatedProduct);
    }
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

    const purchasedQuantities = this.quantityByProduct(items);

    if (!this.hasStockForPurchase(purchasedQuantities)) {
      this.syncCartProducts();
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
    this.applyPurchaseToInventory(purchasedQuantities);
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

  private readProducts(): Product[] {
    try {
      const value = localStorage.getItem(adminProductsKey);
      return value
        ? this.cloneProducts(JSON.parse(value) as Product[])
        : this.cloneProducts(products);
    } catch {
      return this.cloneProducts(products);
    }
  }

  private writeProducts(value: Product[]): void {
    try {
      localStorage.setItem(adminProductsKey, JSON.stringify(value));
    } catch {
      return;
    }
  }

  private readCategoryGroups(): CategoryGroup[] {
    try {
      const value = localStorage.getItem(adminCategoryGroupsKey);
      return value
        ? this.cloneCategoryGroups(JSON.parse(value) as CategoryGroup[])
        : this.cloneCategoryGroups(categoryGroups);
    } catch {
      return this.cloneCategoryGroups(categoryGroups);
    }
  }

  private writeCategoryGroups(value: CategoryGroup[]): void {
    try {
      localStorage.setItem(adminCategoryGroupsKey, JSON.stringify(value));
    } catch {
      return;
    }
  }

  private cloneProducts(value: Product[]): Product[] {
    return value.map((product) => this.cleanProduct(product));
  }

  private cloneCategoryGroups(value: CategoryGroup[]): CategoryGroup[] {
    return value.map((category) => ({
      ...category,
      children: [...category.children],
    }));
  }

  private cleanProduct(product: Product): Product {
    return {
      ...product,
      name: product.name.trimStart(),
      category: product.category.trimStart(),
      subCategory: product.subCategory.trimStart(),
      price: this.cleanNumber(product.price),
      discountPrice: this.cleanNumber(product.discountPrice),
      rating: Math.min(Math.max(this.cleanNumber(product.rating), 0), 5),
      sold: this.cleanNumber(product.sold),
      stock: this.cleanNumber(product.stock),
      sizes: [...product.sizes],
      colors: [...product.colors],
      badges: [...product.badges],
    };
  }

  private cleanNumber(value: number): number {
    return Number.isFinite(value) ? Math.max(value, 0) : 0;
  }

  private cleanQuantity(value: number): number {
    return Number.isFinite(value) ? Math.max(Math.floor(value), 1) : 1;
  }

  private cleanStringList(value: string[]): string[] {
    return value.map((item) => item.trimStart());
  }

  private syncCartProduct(updatedProduct: Product): void {
    this.cartItems.set(
      this.cartItems().map((item) =>
        item.product.id === updatedProduct.id ? { ...item, product: updatedProduct } : item,
      ),
    );
  }

  private syncCartProducts(): void {
    const productsById = new Map(this.products.map((product) => [product.id, product]));

    this.cartItems.set(
      this.cartItems().map((item) => ({
        ...item,
        product: productsById.get(item.product.id) ?? item.product,
      })),
    );
  }

  private quantityByProduct(items: CartItem[]): Map<number, number> {
    const quantities = new Map<number, number>();

    for (const item of items) {
      quantities.set(item.product.id, (quantities.get(item.product.id) ?? 0) + item.quantity);
    }

    return quantities;
  }

  private hasStockForPurchase(purchasedQuantities: Map<number, number>): boolean {
    return [...purchasedQuantities].every(([productId, quantity]) => {
      const product = this.getProductById(productId);

      return Boolean(product && product.stock >= quantity);
    });
  }

  private applyPurchaseToInventory(purchasedQuantities: Map<number, number>): void {
    const updatedProducts = this.products.map((product) => {
      const quantity = purchasedQuantities.get(product.id) ?? 0;

      if (!quantity) {
        return product;
      }

      return this.cleanProduct({
        ...product,
        stock: Math.max(product.stock - quantity, 0),
        sold: product.sold + quantity,
      });
    });

    this.productsSignal.set(updatedProducts);
    this.writeProducts(updatedProducts);
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
