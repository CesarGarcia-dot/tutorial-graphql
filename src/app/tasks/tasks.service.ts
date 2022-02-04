import { Injectable } from '@angular/core';
import { Apollo, gql, QueryRef } from 'apollo-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


const PAGE_USER_SIZE_INIT = 3;

export interface PageInfo {
  totalElements?: number | null;
  currentPage: number;
  pageSize: number;
  orderBy: any;
}


export interface Task {
  uuid: string;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  task_user: Task_User;
}

export interface User {
  uuid: string;
  fullName: string;
  created_at: Date;
  updated_at: Date;
}

export interface Task_User {
  uuid: string;
  user_uuid: string;
  task_uuid: string;
  created_at: Date;
  updated_at: Date;
  users: User;
  tasks: Task[];
}

export interface Response {
  task: Task[];
  task_user: Task_User[];
  data: any;
}



export const GET_TASKS = gql`
query Tasks($offset: Int!, $limit: Int!){
  task(offset: $offset, limit: $limit){
    title
    description
    created_at
    task_user {
      users {
        fullName
      }
    }
  }
  pageInfo:task_aggregate{
      aggregate{
       pages: count
      }
    }
}`;


export const ADD_TASK = gql`
mutation AddTask($description: String!, $title: String!) {
  insert_task(objects: {title: $title, description: $description}) {
    returning {
      title
      description
    }
  }
}`


@Injectable({
  providedIn: 'root'
})
export class TasksService {

  queryRef!: QueryRef<Response>;

  tasks!: Task[];

  pageInfo: PageInfo = {
    totalElements: null,
    currentPage: 0,
    pageSize: PAGE_USER_SIZE_INIT,
    orderBy: null
  }

  pageChangedSubject = new BehaviorSubject<PageInfo>(this.pageInfo);
  pageChanged$ = this.pageChangedSubject.asObservable();
  onTasksChanged!: BehaviorSubject<any>;


  constructor(private apollo: Apollo) {
    this.onTasksChanged = new BehaviorSubject([]);
    this.pageChanged$.subscribe((pageInfo: PageInfo) => this.pageInfo = pageInfo);
  }


  getTasks$ = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        this.queryRef = this.apollo.watchQuery<Response>({
          query: GET_TASKS,
          variables: {
            offset: this.pageInfo.currentPage * this.pageInfo.pageSize,
            limit: this.pageInfo.pageSize,
          },
           fetchPolicy: 'network-only',
        });
        this.queryRef.valueChanges.pipe(
          map(result => result.data)
          ).subscribe((res:any) => {
            const pageInfo: PageInfo = {
              totalElements: res?.pageInfo.aggregate.pages,
              currentPage: this.pageInfo.currentPage,
              pageSize: this.pageInfo.pageSize,
              orderBy: this.pageInfo.orderBy
            };
            this.onPageCursorChanged(pageInfo);
            this.tasks = res.task;
            this.onTasksChanged.next(this.tasks);
            resolve(this.tasks);
          });
      }).catch((err) => {
        console.log(err);
      })
  }


  onPageCursorChanged(pageInfo: PageInfo): void {
    this.pageChangedSubject.next(pageInfo);
  }


  restarPaginationInfo(): void {
    const pageInfo: PageInfo = {
      totalElements: null,
      currentPage: 0,
      pageSize: PAGE_USER_SIZE_INIT,
      orderBy: null
    };
    this.onPageCursorChanged(pageInfo);
  }


}
