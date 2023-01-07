---
layout: "../../layouts/BlogPost.astro"
date: "2016-09-28T21:56:34+02:00"
draft: false
title: "Preloading Routes in Angular 2.1"
description: "This tutorial shows how to preload routes starting with Angular 2.1"
slug: "angular-router-preloading-routes"
categories: ["Angular"]
tags: ["router", "angular", "preloading"]
cover: "preloading-angular.jpg"
---

A few days after the 2.0.0 release of Angular, the Angular team has already released the first beta version of Angular 2.1, which comes with a niftly little performance feature for the @angular/router that I want to show you today.

**Note that the API may change in the future.**

## Preloading resources

When loading resources in the browser, we have the option to tell the browser that it should preload certain assets that the user will eventually need when he triggers an action (e.g. clicking a link) on the website.

```html
<!-- prefetch asset - low priority -->
<link rel="prefetch" href="my-asset.jpg" />
```

This is a great feature for fast response times. The browser will load the requested resources in the background without the need for you to handle it.

When using `prefetch`, the browser will load the given resource URL when there is some idle time and no other work to do for the current page. This gives you the advantage that all resources/operations for the current page have a higher prio and dont't block the rendering.

## Lazy-Loading routes

With Angular 2.1, we will have the same kind of preloading options for routes. But first let's look at this simple example where we're loading a route/ngModule lazily. You can also see the running example in <a href="http://plnkr.co/edit/qPIqrfMoDcAhpdcpAYvy?p=preview">this Plunker</a>:

```typescript
// src/app.module.ts
@Component({
  selector: 'my-app',
  template: `
    <p><a [routerLink]="['/']">Home</a> -
    <a [routerLink]="['/lazy']">Lazy route</a></p>
    <router-outlet></router-outlet>
  `
})
export class App {}

@Component({
  selector: 'my-home',
  template: `<h1>Homepage</h1>`
})
export class Home {}

@NgModule({
  imports: [
    RouterModule.forRoot([
      {path: '', component: Home}
      {path: 'lazy', loadChildren: 'src/my-lazy-module#LazyModule'
    ]),
    BrowserModule
  ],
  declarations: [ App, Home ],
  bootstrap: [ App ]
})
export class AppModule {}
```

```typescript
// src/lazy-module.ts
@Component({
  selector: 'my-lazy-page',
  template: '<h1>My LazyPageComponent loaded!</h1>'
})
export class LazyPageComponent {}

@NgModule({
  imports: [
    RouterModule.forChild([
      {path: '', component: LazyPageComponent}
    ])
  ]
  declarations: [
    LazyPageComponent
  ]
})
export class LazyModule {}
```

So the example above contains nothing new. With the `loadChildren` setting in routes, we can load routes lazily to achieve fast initial load times _which is an awesome feature_. When the user clicks the 'lazy' link, you should notice a little delay. This is because of the module loading that is going on when the route is requested. **In Angular 2.1, we can rid of this delay with the new preloading features. Let's have a look!**

## Enabling Route Preloading

To enable route preloading in our app, we have to configure a `PreloadingStrategy` that we want to use.
In Angular 2.1.0-beta.0, there a only two preloading strategies:

- **NoPreloading** - default, no preloading is done by the router
- **PreloadAllModules** - obviously preloads all modules (I'll explain the details)

To enable the `PreloadAllModules` strategy, we have to provide the PreloadingStrategy in the configuration of the RouterModule:

```typescript
import {RouterModule, PreloadAllModules} from '@angular/router';
@NgModule({
  imports: [
    RouterModule.forRoot([
      {path: '', component: Home}
      {path: 'lazy', loadChildren: 'src/my-lazy-module#LazyModule'
    ], {
      preloadingStrategy: PreloadAllModules
    }),
    BrowserModule
  ],
  declarations: [ App, Home ],
  bootstrap: [ App ]
})
```

**And that's basically it!** You can see the running app in [this Plunker](http://plnkr.co/edit/HsHUkl?p=preview). You will notice that the delay when clicking the "lazy route" link is gone. When you open the network tab of the browser console, you will see a request for the `src/my-lazy-module.ts` file.

### How does the preloading work internally?

There's an internal service called `RouterPreloader` that tries to optimistically load all lazy routes that are configured. The preloader runs in the background and listens to all navigation events. When a navigation event occurs, the preloader will try to fetch all lazy routes with the configured PreloadingStrategy.

The PreloadingStrategy `PreloadAllModules` implements the abstract `PreloadingStrategy` class:

```typescript
export abstract class PreloadingStrategy {
  abstract preload(route: Route, fn: () => Observable<any>): Observable<any>;
}
```

The code of `PreloadAllModules` is really simple:

```typescript
import { _catch } from "rxjs/operator/catch";

export class PreloadAllModules implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    return _catch.call(fn(), () => of(null));
  }
}
```

The `fn()` call is the important part here. When you call this function, you basically say that you want to load the given route/module. If there's an error in the preloading request, the preload method returns an observable with a `null` value.

### Summary

Preloading routes will be a powerful feature in Angular 2.1 that is fully configurable. It is easy to enable if you want to preload all lazy routes. We can even provide our own PreloadingStrategy and fine tune the preloading for very specific use cases. I will cover this in separate blogpost.
