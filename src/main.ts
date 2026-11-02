// M0 placeholder: draws the title and a bouncing Joe. Replaced by the scene manager in M1.
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
document.body.style.cssText = 'margin:0;background:#0b0a0f;overflow:hidden';
canvas.style.cssText = 'display:block;margin:0 auto;background:#14121a';

function fit(): void {
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  canvas.width = 1280;
  canvas.height = 720;
  canvas.style.width = `${1280 * s}px`;
  canvas.style.height = `${720 * s}px`;
}
fit();
window.addEventListener('resize', fit);

let t = 0;
function frame(): void {
  t += 1 / 60;
  ctx.fillStyle = '#14121a';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#efe6d2';
  ctx.font = 'bold 72px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Dungeon Joe', 640, 200);
  const y = 460 - Math.abs(Math.sin(t * 3)) * 140;
  ctx.fillStyle = '#e8c9a0';
  ctx.strokeStyle = '#1a1410';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(640, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
