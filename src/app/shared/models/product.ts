export interface CategoryGroup {
  name: string;
  description: string;
  image: string;
  children: string[];
}

export interface Product {
  id: number;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  discountPrice: number;
  rating: number;
  sold: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image: string;
  badges: string[];
  description: string;
  isNew: boolean;
  isBestSeller: boolean;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: 'Packed' | 'Shipped' | 'Delivered';
  date: string;
}
