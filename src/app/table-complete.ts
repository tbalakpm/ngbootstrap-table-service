import { DecimalPipe } from '@angular/common';
import { Component, QueryList, ViewChildren, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { DataService } from './data.service';
import { NgbdSortableHeader, SortEvent } from './sortable.directive';
import { FormControl } from '@angular/forms';
import {
  switchMap,
  debounceTime,
  tap,
  startWith,
  distinctUntilChanged,
} from 'rxjs/operators';
import { merge, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ngbd-table-complete',
  templateUrl: './table-complete.html',
})
export class NgbdTableComplete implements OnInit {
  total: number;
  filter = new FormControl();
  page: number = 1;
  pageSize: number = 5;
  elements$: Observable<any>;

  pag: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  paginator$ = this.pag.asObservable();

  sort: any = { active: 'position', direction: 'desc' };
  isLoadingResults = true;

  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

  constructor(public dataService: DataService) {}

  ngOnInit() {
    const obsFilter = this.filter.valueChanges.pipe(
      debounceTime(200),
      startWith(null),
      switchMap((res: string) => this.dataService.getLength(res)),
      tap((res: number) => {
        this.total = res;
      })
    );

    this.elements$ = merge(obsFilter, this.paginator$).pipe(
      distinctUntilChanged(),
      tap((_) => {
        this.isLoadingResults = true;
      }),
      switchMap((res) => {
        return this.dataService.getData(
          this.page,
          this.pageSize,
          this.filter.value,
          this.sort.active,
          this.sort.direction
        );
      }),
      tap((_) => (this.isLoadingResults = false))
    );
  }
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.sort = { active: column, direction: direction };
    this.headers.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    this.pag.next(this.sort);
  }
}
