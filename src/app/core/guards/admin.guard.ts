import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  if (adminAuth.isAdminSignedIn()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: {
      returnUrl: state.url
    }
  });
};
