import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-panel',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanel {
  private readonly router = inject(Router);
  private readonly adminAuth = inject(AdminAuthService);

  signOut(): void {
    this.adminAuth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
