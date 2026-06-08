import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home)
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/categories').then((m) => m.Categories)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products').then((m) => m.Products)
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-details/product-details').then((m) => m.ProductDetails)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then((m) => m.Cart)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout)
  },
  {
    path: 'account',
    redirectTo: 'profile'
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile)
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth').then((m) => m.Auth)
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders').then((m) => m.Orders)
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./features/profile/wishlist/wishlist').then((m) => m.Wishlist)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard)
      },
      {
        path: 'categories',
        loadComponent: () => import('./admin/categories/admin-categories').then((m) => m.AdminCategories)
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products/admin-products').then((m) => m.AdminProducts)
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/orders/admin-orders').then((m) => m.AdminOrders)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
