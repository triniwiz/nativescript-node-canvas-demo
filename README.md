# nativescript-node-canvas-demo

Install Dependencies

```bash
npm i 
```

Run Demo

```bash
npm run start
```


We use the ready event to ensure the canvas was laid out before we proceed.

You can use the following Web Canvas APIs '2d', 'webgl', 'webgl2' & 'webgpu'.
```ts
canvas.addEventListener("ready", (event) => {
  console.log("ready");
  const c2d = canvas.getContext('2d');
  c2d.fillStyle = 'red';
  c2d.fillRect(0,0,300,300);
  //swarm(canvas);
  // solarSystem(canvas);
  //breathe_demo(canvas);
});
```