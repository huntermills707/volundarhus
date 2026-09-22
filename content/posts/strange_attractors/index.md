+++ 
draft = false
date = 2026-02-17T14:16:34-08:00
title = "Strange Attractors: Building a Living Mathematical Background"
description = "A post about the real-time strange-attractor visualization running on the author's Hugo site. Built in vanilla JavaScript and rendered to HTML5 Canvas, the simulation iterates deterministic chaotic equations point-by-point at 60fps, producing unique trajectories on every page load. The author describes the modular architecture, Hugo integration techniques, and the appeal of deterministic unpredictability as a living portfolio backdrop."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "Strange Attractors"]
externalLink = ""
series = []
+++


If you're reading this, you're currently watching thousands of mathematical points dance across your screen. That subtle, swirling pattern behind the text isn't a video loop or a CSS animation. It's a real-time simulation of a **strange attractor**, running entirely in your browser.

## Chaos in the Background

Strange attractors are mathematical objects that emerge from dynamical systems. The equations are deterministic, but the behavior is chaotic: never repeating, yet bounded inside intricate, fractal geometries. The Lorenz attractor, discovered in 1963 while modeling atmospheric convection, resembles a butterfly's wings. Others twist into knots, spirals, or alien topologies.

I built this visualization partly to play with the math, but mostly to solve a design problem: how do you add motion and depth to a static Hugo site without hurting performance or shipping heavy video assets?

## Client-Side Chaos

Most web visualizations of this complexity rely on server-side rendering or WebGL shaders. I wanted something lighter, more portable, and entirely self-contained. This implementation performs all calculations in vanilla JavaScript, iterating through attractor equations point-by-point and rendering directly to an HTML5 Canvas.

The architecture is deliberately modular. `strange-attractor-config.js` holds the differential equations and parameters; swap a few constants and the Lorenz system turns into a Thomas or Chen attractor. `color-config.js` controls the rendering: trail persistence, opacity layers, and color gradients, tuned so the background stays readable behind text.
`strange-attractor.js` orchestrates the canvas, the point locations, and the tails fading in and out.

Running at 60fps, the simulation calculates roughly 2,000 points per frame, creating those ghostly trails that slowly fade into the darkness.

## Hugo Integration

Static site generators like Hugo are fast and simple, but embedding interactive JavaScript takes some care. Following techniques from [Andreas Handel's testing methodology](https://aimundo.rbind.io/blog/2021-07-25-testing-javascript-visualizations/) and [Nathan's p5.js integration guide](https://nathan.exchange/posts/p5js-background-for-hugo/), I positioned the canvas as a fixed background layer with a lowered z-index so content scrolls naturally above the animation.

The result is [volundarhus.com](https://volundarhus.com) itself: every visit generates a unique trajectory through mathematical space. No two page loads produce identical patterns, but all of them follow the same underlying equations.

## The Appeal of Deterministic Unpredictability

There's something meditative about watching these structures emerge. Each point follows strict mathematical rules, yet the aggregate behavior feels organic, almost alive. It's a fitting backdrop for a portfolio: structured enough to be functional, chaotic enough to be interesting.

The code is available if you want to adapt it for your own projects, whether that's a subtle animated background or a full-screen mathematical exploration. Check out the repo [here](https://github.com/huntermills707/strange-attractors).

*Refresh the page. Watch the spiral form. You're witnessing chaos, tamed.*
