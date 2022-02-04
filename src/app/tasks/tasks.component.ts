import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { BehaviorSubject, Observable, pipe, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { TasksService, Task, PageInfo } from './tasks.service';




@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {

  title = 'hasura-tutorial';
  tasks$!: Observable<any[]>;
  tasks: any;

  form!: FormGroup;


  loading = true;
  //pagination
  pageSizeOptions: number[] = [3, 10, 25];
  pageInfo!: PageInfo;

  private _unsubscribeAll!: Subject<any>;

  constructor(private fb: FormBuilder, private _tasksService: TasksService) {
    this._unsubscribeAll = new Subject();
    this._tasksService.getTasks$();

  }

  ngOnInit(): void {


    this.loading = true;

    this.tasks$ = this.tasksObs();

    this.form = this.fb.group({
      title: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
    });


   this._tasksService.onTasksChanged.pipe(takeUntil(this._unsubscribeAll)).subscribe((tasks: Task[]) => {
      this.tasks = tasks;
    });


    this._tasksService.pageChanged$.pipe(takeUntil(this._unsubscribeAll)).subscribe((pageInfo: PageInfo) => this.pageInfo = pageInfo);
  }


  onAddTask() {
    // this.apollo.mutate({
    //   mutation: ADD_TASK,
    //   variables: this.form.value
    // }).subscribe(() => {
    //   this.form.controls.title.reset('');
    //   this.form.controls.description.reset('');
    //   this.queryRef.refetch();
    // }, (error) => {
    //   console.log('Error: ' + error)
    // });
  }


  itemsPerPage(pageEvent: PageEvent): void {
    this.handlePageInfoAndEmit(pageEvent);
  }

  handlePageInfoAndEmit(pageEvent: PageEvent): void {
    const pageInfo: PageInfo = {
      totalElements: this.pageInfo.totalElements,
      currentPage: pageEvent.pageIndex,
      pageSize: pageEvent.pageSize,
      orderBy: this.pageInfo.orderBy
    };
    this._tasksService.onPageCursorChanged(pageInfo);
    this._tasksService.getTasks$();
  }

  tasksObs(): Observable<any[]>{
   return this._tasksService.onTasksChanged;
  }

  /**
     * On destroy
     */
   ngOnDestroy(): void
   {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
   }



}
