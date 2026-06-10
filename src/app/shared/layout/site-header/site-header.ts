import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css'
})
export class SiteHeader {
  private readonly router = inject(Router);

  readonly auth = inject(AuthService);
  readonly adminAuth = inject(AdminAuthService);
  readonly shop = inject(ShopService);

  get isAdminArea(): boolean {
    return this.router.url.startsWith('/admin');
  }

  userSignOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }

  adminSignOut(): void {
    this.adminAuth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
