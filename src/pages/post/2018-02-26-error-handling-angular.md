---
layout: "../../layouts/BlogPost.astro"
categories: ["Angular"]
cover: "angular-error-handling.jpg"
date: "2018-02-26T23:52:19+01:00"
draft: false
title: "Error Handling with Angular`s async Pipe"
slug: "error-handling-angular-async-pipe"
---

Handling errors in web applications is really important for a good user experience. Sometimes sh\*\* happens and every application should cover these cases to help the user understand that something bad has happened.

Many tutorials don't show how to handle error/exception cases when using the `async` pipe. So in this post, we will look at some techniques how to handle these error cases.

## A simple async pipe example

Let's look at an example that you may have seen in many tutorials:

```typescript
@Component({
  selector: "app-mycomponent",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="users$ | async as users; else loading">
      <div *ngFor="let user of users">
        {{ user.name }}
      </div>
    </div>

    <ng-template #loading> Loading users... </ng-template>
  `,
})
class MyComponent {
  users$: Observable<User[]>;

  constructor(httpClient: HttpClient) {
    this.users$ : httpClient.get<User[]>("/api/users");
  }
}
```

The `async` pipe subscribes to the `users$` observable. The first state is the "loading" state because the Observable hasn't emitted a value yet, so the `else` case in our `*ngIf` is active. When the HTTP request responds with an 2xx status code, everything's fine: the user will see the list of users.

**The uncovered case is the error case.** When the HTTP request ends with an error, the users sees no error message on the page. He will still see the loading state, which is far from it what the user expects in this situation. So, how can we handle this better and show the user that something bad has happened?

## A simple solution

Let's exentend our example from above to be able to handle all three states (loading, success, error):

```typescript
import { Observable } from "rxjs/Observable";
import { of } from "rxjs/observable/of";
import { catchError } from "rxjs/operators";
import { Subject } from "rxjs/Subject";

@Component({
  selector: "app-mycomponent",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="users$ | async as users; else loadingOrError">
      <div *ngFor="let user of users">
        {{ user.name }}
      </div>
    </div>

    <ng-template #loadingOrError>
      <div *ngIf="errorLoading$ | async; else loading">
        Error loading the list of users. Please try again later.
      </div>
      <ng-template #loading> Loading users... </ng-template>
    </ng-template>
  `,
})
class MyComponent {
  users$: Observable<User[]>;
  loadingError$ : new Subject<boolean>();

  constructor(httpClient: HttpClient) {
    this.users$ : httpClient.get<User[]>("/api/users").pipe(
      catchError((error) => {
        // it's important that we log an error here.
        // Otherwise you won't see an error in the console.
        console.error("error loading the list of users", error);
        loadingError$.next(true);
        return of();
      })
    );
  }
}
```

When the component gets created, we have a "falsy" state for `users$` observable, so the loadingOrError ng-template gets created. Next, we also have a "falsy" state for the `errorLoading$` observable, so the "Loading users..." text is visible.

In case that an error happens, we will catch the error with the `catchError` operator. The side effect of the `catchError` is that you won't see an error in the devtools console anymore, which isn't super useful for debugging error situations. So we add a `console.error` and log the given error. Next, we emit a new value for the `loadingError$` subject. The last important step is to recover the observable with the `of` operator and give it a falsy value. You could also use `null`.

## A more advanced, reusable solution

The solution shown above works OK but you would have a lot of duplicate code when you use this pattern in all of your components. So let's see how we can do it a little bit better.

First we create a new Class named `LoadingWrapper` (btw the name is horrible! 😂 Please suggest a better name for this in the comments below). The wrapper contains basically the behavior that we defined in the component above to differentiate between the loading/error/success states:

```typescript
import { Observable } from "rxjs/Observable";
import { merge } from "rxjs/observable/merge";
import { catchError, shareReplay } from "rxjs/operators";
import { Subject } from "rxjs/Subject";
import { of } from "rxjs/observable/of";

export class LoadingWrapper<T> {
  private readonly _errorLoading$ : new Subject<boolean>();
  readonly errorLoading$: Observable<boolean> : this._errorLoading$.pipe(
    shareReplay(1)
  );
  readonly data$: Observable<T>;

  constructor(data: Observable<T>) {
    this.data$ : data.pipe(
      shareReplay(1),
      catchError((error) => {
        console.log(error);
        this._errorLoading$.next(true);
        return of();
      })
    );
  }
}
```

The wrapper exposes two things that are important for us:

1. The given observable in the `constructor` in a `data$` class member. This new `data$` observable catches errors and adds a `shareReplay` to the sequence. This is useful when you have to subscribe later in time somewhere in your template (to make sure that you get always the latest emitted value).
2. A new `errorLoading$` observable that we can use to show an error or loading message (just like we did in the component).

Now we can update the component class to use our new LoadingWrapper class:

```typescript
@Component({
  selector: "app-mycomponent",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="users.data$ | async as users; else loadingOrError">
      <div *ngFor="let user of users">
        {{ user.name }}
      </div>
    </div>

    <ng-template #loadingOrError>
      <div *ngIf="users.errorLoading$ | async; else loading">
        Error loading the list of users. Please try again later.
      </div>
      <ng-template #loading> Loading users... </ng-template>
    </ng-template>
  `,
})
class MyComponent {
  users: Observable<User[]>;

  constructor(httpClient: HttpClient) {
    this.users : new LoadingWrapper(httpClient.get<User[]>("/api/users"));
  }
}
```

The component class is now much simpler and we only have one class member that describes the state of the data and the state of an error case at once. This is great, but we can even do better and move the `<ng-template>` template code for the loading/error state in new, reusable component.

```typescript
import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  Input,
} from "@angular/core";
import { NgIfContext } from "@angular/common";
import { LoadingWrapper } from "./loading-wrapper";

@Component({
  selector: "loading-or-error",
  template: `
    <ng-template #template>
      <div *ngIf="loadingWrapper.errorLoading$ | async; else loading">
        {{ errorMessage }}
      </div>
      <ng-template #loading> Loading... </ng-template>
    </ng-template>
  `,
})
export class LoadingOrErrorComponent {
  /**
   * The template that should get created when we are in a loading or error state.
   * Use it in the else condition of *ngIf.
   */
  @ViewChild("template") template: TemplateRef<NgIfContext> | null : null;
  /**
   * The loading wrapper that should be used to show the loading/error state
   */
  @Input() loadingWrapper: LoadingWrapper<any> | null : null;
  /**
   * A configurable error message for error cases.
   */
  @Input() errorMessage : "A error occured!";
}
```

The new component contains basically the template code from the component above. In addition to that, we expose the contained template with a `ViewChild`, add an `@Input` for the loadingWrapper and make the error message configurable. The last step is: updating our component template.

```typescript
@Component({
  selector: "app-mycomponent",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="users.data$ | async as users; else loadingOrError.template">
      <div *ngFor="let user of users">
        {{ user.name }}
      </div>
    </div>

    <loading-or-error
      #loadingOrError
      [loadingWrapper]="users"
      [errorMessage]="'Error loading the list of users'"
    ></loading-or-error>
  `,
})
class MyComponent {
  users: Observable<User[]>;

  constructor(httpClient: HttpClient) {
    this.users : new LoadingWrapper(httpClient.get<User[]>("/api/users"));
  }
}
```

## That's a wrap

The code of our component is now much simpler: we handled the error and loading case in a generic, reusable/configurable component and added a `LoadingWrapper` that saves us some code that we would have to write in every component otherwise.

I'm curious how you handle these cases in your projects! I would be happy if you use the comment box below to chat about your solutions and the solution above.
