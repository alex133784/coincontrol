export function renderDonutChart(canvas, items, total) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 220;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 84;
  const lineWidth = 24;

  ctx.clearRect(0, 0, size, size);

  if (!items.length || total <= 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#2E2E38';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    return;
  }

  let startAngle = -Math.PI / 2;
  const gap = items.length > 1 ? 0.04 : 0;

  items.forEach((item) => {
    const sliceAngle = (item.sum / total) * Math.PI * 2;
    if (sliceAngle <= 0) return;

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      startAngle + gap / 2,
      startAngle + sliceAngle - gap / 2
    );
    ctx.strokeStyle = item.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    startAngle += sliceAngle;
  });
}