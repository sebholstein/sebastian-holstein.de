---
layout: "../../layouts/BlogPost.astro"
categories: ["JavaScript"]
cover: "javascript.jpg"
date: "2018-02-28T20:36:47+01:00"
draft: false
title: "JavaScript Tip: Smooth Scroll to an Element"
slug: "scroll-to-element-smooth-javascript"
---

I recently stumbled across a nifty little browser feature when I had to solve the following task: scroll to an element on the page and if possible: scroll to it smoothly. The last time I had to solve this kind of task was when jQuery was everywhere. So I thought it's a good time to check how it can be solved in 2018 without jQuery.

## Scrolling with a JavaScript/Browser API

`element.scrollIntoView()` is a browser API that exists since Internet Explorer 6, so it's obviously a really old API. When calling this method, the browser scrolls to the given element (what a surprise!) and that is nothing new:

```javascript
document.querySelector(".my-div").scrollIntoView();
```

The only downside of this is the scrolling itself: it's not smooth. The user sees the element immediately which can be irritating. So how can we scroll smoothly?

It's possible to provide a configuration for the `scrollIntoView` method (the name of this configuration is `scrollIntoViewOptions`). To enable the smooth scrolling, we simply add this option:

```javascript
document.querySelector(".my-div").scrollIntoView({
  behavior: "smooth",
});
```

### Browser support of `scrollIntoViewOptions`

The bad news is: smooth scrolling with the shown configuration is only supported in Chrome and Firefox right now.

[![caniuse stats for scrollIntoView](/img/2018-02-28-javascript-scroll-smoothly/caniuse-scrollIntoView.png)](https://caniuse.com/#feat=scrollintoview)
<small>Source: [caniuse.com](https://caniuse.com/#feat=scrollintoview)</small>

### Adddng cross browser support

The good news is: there's a polyfill that adds support for `scrollIntoViewOptions` in all browsers that support `requestAnimationFrame`: [https://github.com/iamdustan/smoothscroll](https://github.com/iamdustan/smoothscroll):

```javascript
// run "npm install smoothscroll-polyfill" before
import { smoothscroll } from "smoothscroll-polyfill";
smoothscroll.polyfill();

// this should work now
document.querySelector(".my-div").scrollIntoView({
  behavior: "smooth",
});
```

## That's a Wrap

Enabling smooth scrolling with pure browser API is the way to go. The sad thing about this is the low browser support right now. Thanks to the polyfill author that we can use this feature in all commonly used browsers today.

I hope you liked this quick JavaScript tip 😎. I plan to add more of these little posts in the future.
