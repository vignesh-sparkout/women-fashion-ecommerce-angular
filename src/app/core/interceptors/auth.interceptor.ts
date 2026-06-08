import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const requestWithHeader = request.clone({
    setHeaders: {
      'X-Storefront': 'GlamCart'
    }
  });

  return next(requestWithHeader);
};
