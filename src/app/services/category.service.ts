import { inject, Injectable, signal } from '@angular/core';
import { BaseService } from './base-service';
import { ICategory, ISearch } from '../interfaces';
import { AuthService } from './auth.service';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends BaseService<ICategory> {
  protected override source: string = 'categories';
  private categoryListSignal = signal<ICategory[]>([]);
  
  public search: ISearch = { 
    page: 1,
    size: 5
  }
  get categories$() {
    return this.categoryListSignal;
  }

  public totalItems: any = [];
  private authService: AuthService = inject(AuthService);
  private alertService: AlertService = inject(AlertService);

  getAll() {
    this.findAllWithParams({ page: this.search.page, size: this.search.size}).subscribe({
      next: (response: any) => {
        this.search = {...this.search, ...response.meta};
        this.totalItems = Array.from({length: this.search.totalPages ? this.search.totalPages: 0}, (_, i) => i+1);
        this.categoryListSignal.set(response.data);
      },
      error: (err: any) => {
        console.error('error', err);
      }
    });
  }

  save(category: ICategory) {
    console.log("Enviando categoría:", category);
    this.add(category).subscribe({
      next: (response: any) => {
        this.alertService.displayAlert('success', response.message, 'center', 'top', ['success-snackbar']);
        this.getAll();
      },
      error: (err: any) => {
        this.alertService.displayAlert('error', 'An error occurred adding the category','center', 'top', ['error-snackbar']);
        console.error('error', err);
      }
    });
  }

  update(category: ICategory) {
    this.editCustomSource(`${category.id}`, category).subscribe({
      next: (response: any) => {
        this.alertService.displayAlert('success', response.message, 'center', 'top', ['success-snackbar']);
        this.getAll();
      },
      error: (err: any) => {
        this.alertService.displayAlert('error', 'An error occurred updating the category','center', 'top', ['error-snackbar']);
        console.error('error', err);
      }
    });
  }

  delete(category: ICategory) {
    this.delCustomSource(`${category.id}`).subscribe({
      next: (response: any) => {
        this.alertService.displayAlert('success', response.message, 'center', 'top', ['success-snackbar']);
        this.getAll();
      },
      error: (err: any) => {
        this.alertService.displayAlert('error', 'An error occurred deleting the category','center', 'top', ['error-snackbar']);
        console.error('error', err);
      }
    });
  }

}