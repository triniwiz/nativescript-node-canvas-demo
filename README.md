## NativeScript macOS Three.js WebGPU Example

**Prerequisites**: At least Node 22.11.x or higher.

This example illustrates using WebGPU with Canvas APIs natively on macOS Desktop.

### Try it

```bash
npm install
npm start
```

## Notes

You can use the following Web Canvas APIs `2d`, `webgl`, `webgl2` & `webgpu`.

```ts
canvas.addEventListener("ready", (event) => {
  console.log("ready");
  const c2d = canvas.getContext('2d');
  c2d.fillStyle = 'red';
  c2d.fillRect(0,0,300,300);

  // Run any example:
  //swarm(canvas);
  //solarSystem(canvas);
  //breathe_demo(canvas);
});
```