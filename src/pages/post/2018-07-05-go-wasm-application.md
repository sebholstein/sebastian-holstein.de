---
layout: "../../layouts/BlogPost.astro"
title: "Using Go (Golang) for WebAssembly Applications"
date: "2018-07-05T18:13:10+02:00"
categories: ["Go", "WASM"]
cover: "2018-07-05-go-wasm-application.jpg"
draft: false
---

A week ago, the first beta of Go 1.11 [came out](https://groups.google.com/forum/#!msg/golang-nuts/vpVOVVMLa08/oQQQWX3rCgAJ). For me this is very special release of Go because it's the first version that ships with initial WebAssembly (WASM) support. So it's a good time to get a first impression of using Go as a language for WASM applications.

## Installing Go 1.11 beta

I recommend to install the stable version of Go first. You can download it [here](https://golang.org/dl/). After everything is set up, you can run the following two commands to install the 1.11 beta 1:

```shell
go get golang.org/x/build/version/go1.11beta1
go1.11beta1 download
```

## Writing our first Go/WASM application

After the installation shown above, you should be able to run the `go1.11beta1` command in the terminal. This is the familiar `go` command for the specific go version 1.11beta1. This is a really nice feature because we can test new go versions easily without the need to override the installed stable version of Go.

#### JS Runtime

To communicate between Go and JavaScript, we have to include a JavaScript based runtime. The Go beta 11 release ships with an implementation that lets us invoke certain JavaScript APIs. You can find the implementation in the directory of the Go beta installation. In my case, it was here:

```shell
~/sdk/go1.11beta1/misc/wasm
```

In the directory, you will find the basic runtime `wasm_exec.js` and a simple HTML file that shows how to load/execute a wasm file. I've slightly modified the code and used ES2015 module imports. You can find my example in [my Github repo here](https://github.com/SebastianM/go-wasm).

#### main.go

After setting up the HTML and the runtime, I was ready to write the first Go application targeted for the browser:

```go
package main

import (
	"syscall/js"
	"time"
)

func main() {
	js.Global().Get("console").Call("log", "Hello world Go/wasm!")
	js.Global().Get("document").Call("getElementById", "app").Set("innerText", time.Now().String())
}
```

`Global()` gets the context you would expect when you write a usual JavaScript application in the browser. You have access to all global variables, you can call method or set attributes. As you can see: all these operations are not type safe.

To create the WASM file, we run the following command:

```shell
GOARCH=wasm GOOS=js go1.11beta1 build -o app.wasm main.go
```

#### WASM Mime type support in web servers

What I've noticed was that many web servers don't have support for the `application/wasm` mime type. When the webserver doesn't send this mime type, the browser will permit the execution of the fetched file. So make sure your web server has support for it.

In my example, I used the awesome Caddy webserver (which is also Go based) and configured the mime type in the `Caddyfile`:

```text
localhost

mime {
  .wasm application/wasm
}

gzip {
 ext *
}
```

## Observations

Here are some observations I've made using Go for wasm applications:

### 1) Large wasm file sizes

Let's look at this simple example:

```go
package main

import (
	"syscall/js"
)

func main() {
	js.Global().Get("console").Call("log", "Hello world Go/wasm!")
}
```

When I compiled this application the first time to wasm, I was a little bit shocked how big the wasm file was:  
**1.3 MB uncompressed for the app.wasm + 11.3 KB for the JS runtime**:

[![devtools](/img/2018-07-05-go-wasm-application/size-devtools.png)](/img/2018-07-05-go-wasm-application/size-devtools.png)
<em><small>Chrome Devtools network panel: 1.3 MB wasm file</small></em>

With GZIP compression turned on, it went down to a total size of **295 KB**, which is also way too big for a simple application like that.

**So why is the wasm file this big?**  
As Go is a language that compiles to a single executable binary, the language ships runtime in every Go application. This runtime needs to be part of the WASM file to be able to run the application in the browser. The runtime is by far the biggest part of the 1.3 MB big wasm file.

Another reason is the lack of **tree shaking** features in Go. The JS community worked hard in the last years to get rid of unused code in built JavaScript bundles. Projects like Rollup or Webpack got really good at it. The popular frontend frameworks/libraries like Angular or React changed their code bases to produce more tree shakable friendly code which led to much smaller application bundle sizes.

In the Go ecosystem, tree shaking isn't a really topic because application size isn't that important on the server side. So when you import a Go package right now, you will get the whole package bundled in the WASM file - independent of how many features you are using from this package.

### 2) No thread support

All major browsers don't have thread support (Safari is the only exception). All other browser vendors are currently working on that ([you can find the proposal here](https://github.com/WebAssembly/threads) and the [tracking issue here](https://github.com/WebAssembly/design/issues/1073)). So when you load a wasm file like in my example, it will run on the main thread **and therefor can block the main thread just like JavaScript**.

### 3) No browser developer tools support

As of writing this post, there is no support in the browser devtools for debugging/inspecting WebAssembly applications in any way. You will have to build a bridge between JavaScript and your language of choice to have basic logging features in the browser. The browser vendors are working on that.

## That's a wrap

I hope I could give you a first impression of using Go as a WASM language. One thing is clear: this is just the beginning of WASM and Go. I'm exited what improvements, tools and frameworks/libraries we will see in the future.

You can find the code for the application in my [Github repo](https://github.com/SebastianM/go-wasm).
