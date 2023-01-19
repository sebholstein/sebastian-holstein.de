---
layout: "../../layouts/BlogPost.astro"
title: "Dynamic Tag Names in SolidJS"
date: "2023-01-07T10:44:00+02:00"
categories: ["SolidJS"]
draft: false
---

In SolidJS, it is straightforward to alter the tag name. SolidJS features the Dynamic component, which is ideal for situations in which the tag name is not static and needs to be determined through application logic.

## Using the `Dynamic` component

To utilize the Dynamic component, consider the following example where we aim to create a component that returns a HTML heading element based on the level specified in the props:

```tsx
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: JSX.Element;
}

export const Heading: Component<HeadingProps> = (props) => {
  // here we want to return h1/h2/h3/ base on the level...
  return <></>;
};
```

The solution is a simple one-liner:

```tsx
import { Dynamic } from "solid-js/web";
import { Component, JSX } from "solid-js";

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: JSX.Element;
}

export const Heading: Component<HeadingProps> = (props) => {
  return <Dynamic component={`h${props.level}`}>{props.children}</Dynamic>;
};
```

This solution makes it easy to create semantic HTML. You can find more details about the <a href="https://www.solidjs.com/docs/latest/api#dynamic" target="_blank">Dynamic component here</a>.

Here's an example of the component in use:

```tsx
<Heading level={3}>Hello world!</Heading>
// renders <h3>Hello world!</h3>
```
