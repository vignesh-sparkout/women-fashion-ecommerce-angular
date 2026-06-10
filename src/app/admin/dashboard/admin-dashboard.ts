import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';
import { CustomerOrder } from '../../shared/models/product';

interface OrderStatusSummary {
  label: CustomerOrder['status'];
  count: number;
  color: string;
}

interface SalesPoint {
  label: string;
  value: number;
  x: number;
  y: number;
}

interface SalesOverview {
  points: SalesPoint[];
  scale: number[];
  linePath: string;
  fillPath: string;
  total: number;
  averageOrderValue: number;
  bestDayLabel: string;
  bestDayValue: number;
  orderCount: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  readonly shop = inject(ShopService);
  private readonly statusColors: Record<CustomerOrder['status'], string> = {
    Delivered: '#22c55e',
    Shipped: '#38bdf8',
    Packed: '#f59e0b',
  };

  readonly totalOrders = computed(() => this.shop.allOrders().length);
  readonly totalProducts = computed(() => this.shop.products.length);
  readonly totalCategories = computed(() => this.shop.categoryGroups.length);
  readonly totalRevenue = computed(() =>
    this.shop.allOrders().reduce((sum, order) => sum + order.total, 0),
  );
  readonly latestOrders = computed(() => this.shop.allOrders().slice(0, 5));
  readonly salesOverview = computed<SalesOverview>(() => this.buildSalesOverview());
  readonly orderStatusSummaries = computed<OrderStatusSummary[]>(() => {
    const orders = this.shop.allOrders();

    return (['Delivered', 'Shipped', 'Packed'] as CustomerOrder['status'][]).map((status) => ({
      label: status,
      count: orders.filter((order) => order.status === status).length,
      color: this.statusColors[status],
    }));
  });
  readonly statusDonutBackground = computed(() => {
    const total = Math.max(this.totalOrders(), 1);
    let start = 0;
    const segments = this.orderStatusSummaries().map((summary) => {
      const end = start + (summary.count / total) * 100;
      const segment = `${summary.color} ${start}% ${end}%`;

      start = end;
      return segment;
    });

    return this.totalOrders() ? `conic-gradient(${segments.join(', ')})` : '#edf2f7';
  });

  statusPercent(count: number): number {
    return this.totalOrders() ? Math.round((count / this.totalOrders()) * 100) : 0;
  }

  private buildSalesOverview(): SalesOverview {
    const dayCount = 7;
    const chartWidth = 720;
    const chartHeight = 230;
    const chartTop = 18;
    const chartBottom = 28;
    const chartRange = chartHeight - chartTop - chartBottom;
    const days = this.recentDays(dayCount);
    const totalsByDay = new Map(days.map((date) => [this.dayKey(date), 0]));
    const ordersByDay = new Map(days.map((date) => [this.dayKey(date), 0]));

    for (const order of this.shop.allOrders()) {
      const orderDate = new Date(order.createdAt);
      const key = this.dayKey(orderDate);

      if (!totalsByDay.has(key)) {
        continue;
      }

      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + order.total);
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    }

    const values = days.map((date) => totalsByDay.get(this.dayKey(date)) ?? 0);
    const orderCount = days.reduce((sum, date) => sum + (ordersByDay.get(this.dayKey(date)) ?? 0), 0);
    const maxValue = Math.max(...values, 1000);
    const points = days.map((date, index) => {
      const value = values[index];
      const x = (index / (dayCount - 1)) * chartWidth;
      const y = chartTop + (1 - value / maxValue) * chartRange;

      return {
        label: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        value,
        x,
        y,
      };
    });
    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ');
    const fillPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
    const total = values.reduce((sum, value) => sum + value, 0);
    const bestPoint = points.reduce(
      (best, point) => (point.value > best.value ? point : best),
      points[0],
    );

    return {
      points,
      scale: [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value) =>
        Math.round(value),
      ),
      linePath,
      fillPath,
      total,
      averageOrderValue: orderCount ? Math.round(total / orderCount) : 0,
      bestDayLabel: bestPoint.label,
      bestDayValue: bestPoint.value,
      orderCount,
    };
  }

  private recentDays(count: number): Date[] {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return Array.from({ length: count }, (_, index) => {
      const date = new Date(today);

      date.setDate(today.getDate() - (count - 1 - index));
      return date;
    });
  }

  private dayKey(date: Date): string {
    const day = new Date(date);

    day.setHours(0, 0, 0, 0);
    return day.toISOString().slice(0, 10);
  }
}
