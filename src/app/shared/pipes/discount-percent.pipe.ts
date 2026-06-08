import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'discountPercent'
})
export class DiscountPercentPipe implements PipeTransform {
  transform(price: number, discountPrice: number): number {
    if (!price || discountPrice >= price) {
      return 0;
    }

    return Math.round(((price - discountPrice) / price) * 100);
  }
}
