import "@nativescript/macos-node-api";
import "@nativescript/foundation/dom/index.js";
import "./app.ts";

import "@nativescript/canvas-napi";
import damagedHelmet from './three/damaged_helmet';

import { ImageAsset } from "@nativescript/canvas-napi";

objc.import("AppKit");
objc.import("OpenGL");
objc.import("QuartzCore");

let LAF = 0;

function flappyBird(canvas) {
  var ctx,
    width,
    height,
    fgpos = 0,
    frames = 0,
    score = 0,
    best = 0,
    currentstate,
    states = {
      Splash: 0,
      Game: 1,
      Score: 2,
    },
    okbtn,
    bird = {
      x: 60,
      y: 0,
      frame: 0,
      animation: [0, 1, 2, 1],
      rotation: 0,
      velocity: 0,
      radius: 12,
      gravity: 0.25,
      _jump: 4.6,

      jump: function () {
        this.velocity = -this._jump;
      },

      update: function () {
        var n = currentstate === states.Splash ? 10 : 5;
        this.frame += frames % n === 0 ? 1 : 0;
        this.frame %= this.animation.length;

        if (currentstate === states.Splash) {
          this.y = height - 280 + 5 * Math.cos(frames / 10);
          this.rotation = 0;
        } else {
          this.velocity += this.gravity;
          this.y += this.velocity;

          if (this.y >= height - s_fg.height - 10) {
            this.y = height - s_fg.height - 10;
            if (currentstate === states.Game) {
              currentstate = states.Score;
            }
            this.velocity = this._jump;
          }

          if (this.velocity >= this._jump) {
            this.frame = 1;
            this.rotation = Math.min(Math.PI / 2, this.rotation + 0.3);
          } else {
            this.rotation = -0.3;
          }
        }
      },

      draw: function (ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        var n = this.animation[this.frame];
        s_bird[n].draw(ctx, -s_bird[n].width / 2, -s_bird[n].height / 2);
        ctx.restore();
      },
    },
    pipes = {
      _pipes: [],

      reset: function () {
        this._pipes = [];
      },

      update: function () {
        if (frames % 100 === 0) {
          var _y =
            height -
            (s_pipeSouth.height + s_fg.height + 120 + 200 * Math.random());
          this._pipes.push({
            x: 500,
            y: _y,
            width: s_pipeSouth.width,
            height: s_pipeSouth.height,
          });
        }
        for (var i = 0, len = this._pipes.length; i < len; i++) {
          var p = this._pipes[i];

          if (i === 0) {
            score += p.x === bird.x ? 1 : 0;

            var cx = Math.min(Math.max(bird.x, p.x), p.x + p.width);
            var cy1 = Math.min(Math.max(bird.y, p.y), p.y + p.height);
            var cy2 = Math.min(
              Math.max(bird.y, p.y + p.height + 80),
              p.y + 2 * p.height + 80
            );

            var dx = bird.x - cx;
            var dy1 = bird.y - cy1;
            var dy2 = bird.y - cy2;

            var d1 = dx * dx + dy1 * dy1;
            var d2 = dx * dx + dy2 * dy2;

            var r = bird.radius * bird.radius;

            if (r > d1 || r > d2) {
              currentstate = states.Score;
            }
          }

          p.x -= 2;
          if (p.x < -50) {
            this._pipes.splice(i, 1);
            i--;
            len--;
          }
        }
      },

      draw: function (...args) {
        for (var i = 0, len = this._pipes.length; i < len; i++) {
          var p = this._pipes[i];
          s_pipeSouth.draw(ctx, p.x, p.y);
          s_pipeNorth.draw(ctx, p.x, p.y + 80 + p.height);
        }
      },
    },
    img;

  function onpress(evt) {
    switch (currentstate) {
      case states.Splash:
        currentstate = states.Game;
        bird.jump();
        break;
      case states.Game:
        bird.jump();
        break;
      case states.Score:
        var mx = evt.offsetX,
          my = evt.offsetY;

        if (mx == null || my == null) {
          mx = evt.clientX;
          my = evt.clientY;
        }

        if (
          okbtn.x < mx &&
          mx < okbtn.x + okbtn.width &&
          okbtn.y < my &&
          my < okbtn.y + okbtn.height
        ) {
          pipes.reset();
          currentstate = states.Splash;
          score = 0;
        }
        break;
    }
  }

  function main() {
    width = canvas.clientWidth * window.devicePixelRatio;
    height = canvas.clientHeight * window.devicePixelRatio;

    canvas.addEventListener("mousedown", onpress);

    var evt = "mousedown";
    if (width >= 500) {
      width = 320;
      height = 480;
      canvas.style.border = "1px solid #000";
      evt = "mousedown";
    }

    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");

    //ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    currentstate = states.Splash;
    img = new ImageAsset();
    img.fromUrlSync(
      "https://raw.githubusercontent.com/maxwihlborg/youtube-tutorials/master/flappy/starter/res/sheet.png"
    );

    initSprites(img);
    ctx.fillStyle = s_bg.color;

    okbtn = {
      x: (width - s_buttons.Ok.width) / 2,
      y: height - 200,
      width: s_buttons.Ok.width,
      height: s_buttons.Ok.height,
    };
    run();

    /*
		img = document.createElement('img');

		img.onload = (event) => {
			initSprites(img);
			ctx.fillStyle = s_bg.color;

			(okbtn = {
				x: (width - s_buttons.Ok.width) / 2,
				y: height - 200,
				width: s_buttons.Ok.width,
				height: s_buttons.Ok.height,
			}),
				run();
		};
		img.src = 'https://raw.githubusercontent.com/maxwihlborg/youtube-tutorials/master/flappy/starter/res/sheet.png';

		*/
  }

  function run() {
    var loop = function (ts) {
      render();
      update();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function update() {
    frames++;

    if (currentstate !== states.Score) {
      fgpos = (fgpos - 2) % 14;
    } else {
      best = Math.max(best, score);
    }

    if (currentstate === states.Game) {
      pipes.update();
    }

    bird.update();
  }

  function render() {
    ctx.fillRect(0, 0, width, height);

    s_bg.draw(ctx, 0, height - s_bg.height);
    s_bg.draw(ctx, s_bg.width, height - s_bg.height);

    pipes.draw(ctx);
    bird.draw(ctx);

    s_fg.draw(ctx, fgpos, height - s_fg.height);
    s_fg.draw(ctx, fgpos + s_fg.width, height - s_fg.height);

    var width2 = width / 2;

    if (currentstate === states.Splash) {
      s_splash.draw(ctx, width2 - s_splash.width / 2, height - 300);
      s_text.GetReady.draw(
        ctx,
        width2 - s_text.GetReady.width / 2,
        height - 380
      );
    }

    if (currentstate === states.Score) {
      s_text.GameOver.draw(
        ctx,
        width2 - s_text.GameOver.width / 2,
        height - 400
      );
      s_score.draw(ctx, width2 - s_score.width / 2, height - 340);
      s_buttons.Ok.draw(ctx, okbtn.x, okbtn.y);

      s_numberS.draw(ctx, width2 - 47, height - 304, score, null, 10);
      s_numberS.draw(ctx, width2 - 47, height - 262, best, null, 10);
    } else {
      s_numberB.draw(ctx, null, 20, score, width2);
    }

    //  ctx.render();
  }

  var s_bird,
    s_bg,
    s_fg,
    s_pipeNorth,
    s_pipeSouth,
    s_text,
    s_score,
    s_splash,
    s_buttons,
    s_numberS,
    s_numberB;

  function Sprite(img, x, y, width, height) {
    this.img = img;
    this.x = x * 2;
    this.y = y * 2;
    this.width = width * 2;
    this.height = height * 2;
  }

  Sprite.prototype.draw = function (ctx, x, y) {
    ctx.drawImage(
      this.img,
      this.x,
      this.y,
      this.width,
      this.height,
      x,
      y,
      this.width,
      this.height
    );
  };

  function initSprites(img) {
    s_bird = [
      new Sprite(img, 156, 115, 17, 12),
      new Sprite(img, 156, 128, 17, 12),
      new Sprite(img, 156, 141, 17, 12),
    ];

    s_bg = new Sprite(img, 0, 0, 138, 114);
    s_bg.color = "#70C5CF";
    s_fg = new Sprite(img, 138, 0, 112, 56);

    s_pipeNorth = new Sprite(img, 251, 0, 26, 200);
    s_pipeSouth = new Sprite(img, 277, 0, 26, 200);

    s_text = {
      FlappyBird: new Sprite(img, 59, 114, 96, 22),
      GameOver: new Sprite(img, 59, 136, 94, 19),
      GetReady: new Sprite(img, 59, 155, 87, 22),
    };
    s_buttons = {
      Rate: new Sprite(img, 79, 177, 40, 14),
      Menu: new Sprite(img, 119, 177, 40, 14),
      Share: new Sprite(img, 159, 177, 40, 14),
      Score: new Sprite(img, 79, 191, 40, 14),
      Ok: new Sprite(img, 119, 191, 40, 14),
      Start: new Sprite(img, 159, 191, 40, 14),
    };

    s_score = new Sprite(img, 138, 56, 113, 58);
    s_splash = new Sprite(img, 0, 114, 59, 49);

    s_numberS = new Sprite(img, 0, 177, 6, 7);
    s_numberB = new Sprite(img, 0, 188, 7, 10);

    s_numberS.draw = s_numberB.draw = function (
      ctx,
      x,
      y,
      num,
      center,
      offset
    ) {
      num = num.toString();
      var step = this.width + 2;

      if (center) {
        x = center - (num.length * step - 2) / 2;
      }

      if (offset) {
        x += step * (offset - num.length);
      }

      for (var i = 0, len = num.length; i < len; i++) {
        var n = parseInt(num[i]);
        ctx.drawImage(
          img,
          step * n,
          this.y,
          this.width,
          this.height,
          x,
          y,
          this.width,
          this.height
        );
        x += step;
      }
    };
  }

  main();
}

function solarSystem(canvas) {
  const width = canvas.clientWidth * window.devicePixelRatio;
  const height = canvas.clientHeight * window.devicePixelRatio;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  let sun;
  let moon;
  let earth;

  const scale = NSScreen.mainScreen.backingScaleFactor;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //ctx.render();

  async function init() {
    // sun = await ImageSource.fromUrl('https://mdn.mozillademos.org/files/1456/Canvas_sun.png');
    // moon = await ImageSource.fromUrl('https://mdn.mozillademos.org/files/1443/Canvas_moon.png');
    // earth = await ImageSource.fromUrl('https://mdn.mozillademos.org/files/1429/Canvas_earth.png');

    sun = new ImageAsset();
    moon = new ImageAsset();
    earth = new ImageAsset();

    // await sun.fromUrl('https://raw.githubusercontent.com/NativeScript/canvas/refs/heads/feat/macos-napi/napi/canvas-napi/examples/assets/canvas_sun.png');
    // await moon.fromUrl('https://raw.githubusercontent.com/NativeScript/canvas/refs/heads/feat/macos-napi/napi/canvas-napi/examples/assets/canvas_moon.png');
    // await earth.fromUrl('https://raw.githubusercontent.com/NativeScript/canvas/refs/heads/feat/macos-napi/napi/canvas-napi/examples/assets/canvas_earth.png');

    sun.fromUrlSync(
      "https://raw.githubusercontent.com/NativeScript/canvas/refs/heads/feat/macos-napi/napi/canvas-napi/examples/assets/canvas_sun.png"
    );
    moon.fromUrlSync(
      "https://raw.githubusercontent.com/NativeScript/canvas/refs/heads/feat/macos-napi/napi/canvas-napi/examples/assets/canvas_moon.png"
    );
    earth.fromUrlSync(
      "https://raw.githubusercontent.com/NativeScript/canvas/refs/heads/feat/macos-napi/napi/canvas-napi/examples/assets/canvas_earth.png"
    );
    LAF = requestAnimationFrame(draw);
  }

  ctx.scale(scale, scale);

  function draw() {
    ctx.globalCompositeOperation = "destination-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "rgba(0, 153, 255, 0.4)";
    ctx.save();
    ctx.translate(150, 150);

    // Earth
    let time = new Date();
    ctx.rotate(
      ((2 * Math.PI) / 60) * time.getSeconds() +
        ((2 * Math.PI) / 60000) * time.getMilliseconds()
    );
    ctx.translate(105, 0);
    ctx.fillRect(0, -12, 40, 24); // Shadow
    ctx.drawImage(earth, -12, -12);

    // Moon
    ctx.save();
    ctx.rotate(
      ((2 * Math.PI) / 6) * time.getSeconds() +
        ((2 * Math.PI) / 6000) * time.getMilliseconds()
    );
    ctx.translate(0, 28.5);
    ctx.drawImage(moon, -3.5, -3.5);

    ctx.restore();
    ctx.restore();

    // Earth orbit arc
    ctx.beginPath();
    ctx.arc(150, 150, 105, 0, Math.PI * 2, false);
    ctx.stroke();

    //
    ctx.drawImage(sun, 0, 0, 300, 300);

    // ctx.render();

    LAF = requestAnimationFrame(draw);
  }

  init();
}

function swarm(canvas, width?: number, height?: number) {
  var requestAnimFrame = requestAnimationFrame;

  function init() {
    //canvas.nativeView.setHandleInvalidationManually(true);
    // Initialize the context of the canvas

    // canvas.nativeView.handleInvalidationManually = true
    // Set the canvas width and height to occupy full window
    var W = width ?? canvas.clientWidth * window.devicePixelRatio,
      H = height ?? canvas.clientHeight * window.devicePixelRatio;

    canvas.width = W;
    canvas.height = H;

    var ctx = canvas.getContext ? canvas.getContext("2d") : canvas;

    // ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Some variables for later use
    var particleCount = 500,
      particles = [],
      minDist = 50,
      dist;

    // Function to paint the canvas black
    function paintCanvas() {
      // Set the fill color to black
      ctx.fillStyle = "black";

      // This will create a rectangle of white color from the
      // top left (0,0) to the bottom right corner (W,H)
      //ctx.clearRect(0,0, W,H);
      ctx.fillRect(0, 0, W, H);
    }

    // Now the idea is to create some particles that will attract
    // each other when they come close. We will set a minimum
    // distance for it and also draw a line when they come
    // close to each other.

    // The attraction can be done by increasing their velocity as
    // they reach closer to each other

    // Let's make a function that will act as a class for
    // our particles.

    function Particle() {
      // Position them randomly on the canvas
      // Math.random() generates a random value between 0
      // and 1 so we will need to multiply that with the
      // canvas width and height.
      this.x = Math.random() * W;
      this.y = Math.random() * H;

      // We would also need some velocity for the particles
      // so that they can move freely across the space
      this.vx = -1 + Math.random() * 2;
      this.vy = -1 + Math.random() * 2;

      // Now the radius of the particles. I want all of
      // them to be equal in size so no Math.random() here..
      this.radius = 4;

      // This is the method that will draw the Particle on the
      // canvas. It is using the basic fillStyle, then we start
      // the path and after we use the `arc` function to
      // draw our circle. The `arc` function accepts four
      // parameters in which first two depicts the position
      // of the center point of our arc as x and y coordinates.
      // The third value is for radius, then start angle,
      // end angle and finally a boolean value which decides
      // whether the arc is to be drawn in counter clockwise or
      // in a clockwise direction. False for clockwise.
      this.draw = function () {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);

        // Fill the color to the arc that we just created
        ctx.fill();
      };
    }

    // Time to push the particles into an array
    for (var i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Function to draw everything on the canvas that we'll use when
    // animating the whole scene.
    var p = new Particle();

    function draw() {
      // Call the paintCanvas function here so that our canvas
      // will get re-painted in each next frame
      paintCanvas();

      // Call the function that will draw the balls using a loop
      for (var i = 0; i < particles.length; i++) {
        p = particles[i];
        p.draw();
      }

      //Finally call the update function
      update();

      // ctx.render();
    }

    // Give every particle some life
    function update() {
      // In this function, we are first going to update every
      // particle's position according to their velocities
      for (var i = 0; i < particles.length; i++) {
        p = particles[i];

        // Change the velocities
        p.x += p.vx;
        p.y += p.vy;

        // We don't want to make the particles leave the
        // area, so just change their position when they
        // touch the walls of the window
        if (p.x + p.radius > W) p.x = p.radius;
        else if (p.x - p.radius < 0) {
          p.x = W - p.radius;
        }

        if (p.y + p.radius > H) p.y = p.radius;
        else if (p.y - p.radius < 0) {
          p.y = H - p.radius;
        }

        // Now we need to make them attract each other
        // so first, we'll check the distance between
        // them and compare it to the minDist we have
        // already set

        // We will need another loop so that each
        // particle can be compared to every other particle
        // except itself
        for (var j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          distance(p, p2);
        }
      }
    }

    // Distance calculator between two particles
    function distance(p1, p2) {
      var dist,
        dx = p1.x - p2.x,
        dy = p1.y - p2.y;

      dist = Math.sqrt(dx * dx + dy * dy);

      // Draw the line when distance is smaller
      // then the minimum distance
      if (dist <= minDist) {
        // Draw the line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255," + (1.2 - dist / minDist) + ")";
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        //ctx.closePath();

        // Some acceleration for the partcles
        // depending upon their distance
        var ax = dx / 2000,
          ay = dy / 2000;

        // Apply the acceleration on the particles
        p1.vx -= ax;
        p1.vy -= ay;

        p2.vx += ax;
        p2.vy += ay;
      }
    }

    // Start the main animation loop using requestAnimFrame
    function animloop() {
      LAF = requestAnimFrame(animloop);
      draw();
    }

    animloop();
  }

  init();
}

function breathe_demo(canvas) {
  const cartesian2Canvas = (v, center) => {
    return { x: v.x + center.x, y: -1 * v.y + center.y };
  };

  const cartesian2Polar = (v) => {
    return { x: Math.atan2(v.y, v.x), y: Math.sqrt(v.x * v.x + v.y * v.y) };
  };

  const polar2Cartesian = (p) => {
    return {
      x: p.radius * Math.cos(p.theta),
      y: p.radius * Math.sin(p.theta),
    };
  };

  const polar2Canvas = (p, center) => {
    return cartesian2Canvas(polar2Cartesian(p), center);
  };

  function breathe(canvas) {
    const width = canvas.clientWidth * window.devicePixelRatio;
    const height = canvas.clientHeight * window.devicePixelRatio;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    let progress = 0;

    const c1 = "#61bea2";
    const c2 = "#529ca0";

    const mix = (value, x, y) => {
      return x * (1 - value) + y * value;
    };

    const Ring = ({ context, index, progress }) => {
      context.save();
      context.beginPath();
      const R = width / 4;
      const center = { x: width / 2, y: height / 2 - 64 };
      const theta = (index * (2 * Math.PI)) / 6;

      const { x, y } = polar2Canvas(
        { theta, radius: progress * R },
        { x: 0, y: 0 }
      );
      const scale = mix(progress, 0.3, 1);

      //context.translate(x, y);

      context.arc(x, y, R, 0, 2 * Math.PI);

      context.fillStyle = index % 2 ? c1 : c2;
      context.fill();
      context.restore();
    };

    const center = { x: width / 2, y: height / 2 - 64 };

    const start = Date.now();
    const duration = 5000; // 3000ms or 3 seconds

    function breathingEase(t) {
      if (t <= 0.5) {
        // Inhale (first half of the cycle)
        return 0.5 - 0.5 * Math.cos(Math.PI * t * 2);
      } else {
        // Exhale (second half of the cycle)
        return 0.5 + 0.5 * Math.cos(Math.PI * (t - 0.5) * 2);
      }
    }

    const tick = () => {
      const elapsed = (Date.now() - start) % duration;
      const rawProgress = elapsed / duration; // Normalize progress to range [0, 1]
      progress = breathingEase(rawProgress); // Apply bounce easing to progress

      context.save();
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgb(36,43,56)";
      context.fillRect(0, 0, width, height);
      context.filter = "blur(1px)";
      context.globalCompositeOperation = "screen";
      context.translate(center.x, center.y);

      // Rotate and draw rings
      context.rotate(mix(progress, -Math.PI, 0));
      for (let i = 0; i < 6; i++) {
        Ring({ context: context, index: i, progress });
      }

      context.restore();

      // context.render();

      // Loop the animation
      requestAnimationFrame(tick);
    };

    tick();
  }

  breathe(canvas);
}

const windowDoc = document.createElement("window");

windowDoc.style.width = `${NSScreen.mainScreen.frame.size.width * 0.66}`;
windowDoc.style.height = `${NSScreen.mainScreen.frame.size.height * 0.66}`;

async function webgpuTriangle(canvas) {
  const tri = `@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );

  return vec4f(pos[VertexIndex], 0.0, 1.0);
}`;

  const red = `@fragment
fn main() -> @location(0) vec4f {
  return vec4(1.0, 0.0, 0.0, 1.0);
}`;
  // todo
  if ("gpu" in navigator) {
    const adapter = await navigator.gpu.requestAdapter();
    let device = await adapter.requestDevice();
    device.addEventListener("uncapturederror", (event: any) => {
      console.error("A WebGPU error was not captured:", event.error.message);
    });

    const devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const context = canvas.getContext("webgpu");

    const capabilities = context.getCapabilities(adapter);

    const presentationFormat = capabilities.formats[0];
    const alphaMode = capabilities.alphaModes[0];
    const presentMode = capabilities.presentModes[0];
    context.configure({
      device,
      format: presentationFormat,
      alphaMode,
      presentMode,
    });

    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: tri,
        }),
        entryPoint: "main",
      },
      fragment: {
        module: device.createShaderModule({
          code: red,
        }),
        targets: [
          {
            format: presentationFormat,
          },
        ],
        entryPoint: "main",
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    function frame() {
      const framebuffer = context.getCurrentTexture();
      if (!framebuffer) {
        requestAnimationFrame(frame);
        return;
      }

      const commandEncoder = device.createCommandEncoder();
      const textureView = framebuffer.createView();

      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: [0, 0, 0, 1],
            loadOp: "load",
            storeOp: "store",
          },
        ],
      });
      passEncoder.setPipeline(pipeline);
      passEncoder.draw(3);
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);
      context.presentSurface();
      //	requestAnimationFrame(frame);

      requestAnimationFrame(frame);
    }

    frame();
  }
}

const canvas = document.createElement("canvas");

canvas.addEventListener("ready", (event) => {
  console.log("ready");
 // swarm(canvas);
  // solarSystem(canvas);
  //breathe_demo(canvas);
  damagedHelmet.run(canvas);
});

windowDoc.setAttribute(
  "styleMask",
  (NSWindowStyleMask.Titled |
    NSWindowStyleMask.Closable |
    NSWindowStyleMask.Miniaturizable |
    NSWindowStyleMask.Resizable |
    NSWindowStyleMask.FullSizeContentView) as never
);

const color = NSColor.colorWithCalibratedHueSaturationBrightnessAlpha(
  0,
  0,
  0.2,
  0.5
);
const background = `rgba(${color.redComponent * 255}, ${
  color.greenComponent * 255
}, ${color.blueComponent * 255}, ${color.alphaComponent})`;

windowDoc.style.backgroundColor = "white";
windowDoc.style.width = NSScreen.mainScreen.frame.size.width * 0.66;
windowDoc.style.height = NSScreen.mainScreen.frame.size.height * 0.66;

windowDoc.appendChild(canvas);

document.body.appendChild(windowDoc);

globalThis.NativeScriptApplication.launch();
