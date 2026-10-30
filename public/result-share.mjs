// Build a personal result image ahead of the click: native sharing needs the
// click's user activation, so canvas encoding must not delay navigator.share().
export function prepareResultImage({ game, number, won, mode, day, headline, stats, url }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas is unavailable'));

  const accent = won ? '#a8ffd0' : '#ffb0b9';
  const glow = won ? '#2b765c' : '#803445';
  const background = ctx.createLinearGradient(0, 0, 1200, 630);
  background.addColorStop(0, '#171122');
  background.addColorStop(1, '#0b0a13');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1200, 630);
  const halo = ctx.createRadialGradient(920, 210, 20, 920, 210, 520);
  halo.addColorStop(0, `${glow}99`);
  halo.addColorStop(1, '#0b0a1300');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.strokeStyle = '#ffffff0c';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1200; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke(); }
  for (let y = 0; y < 630; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, 1130, 560);
  ctx.fillStyle = '#211b2d';
  ctx.fillRect(58, 57, 1084, 66);
  ctx.fillStyle = '#ffad5b';
  ctx.font = 'bold 23px monospace';
  ctx.fillText('▣  RAPID GAMES  /  ' + number, 84, 99);
  ctx.textAlign = 'right';
  ctx.fillText(mode === 'daily' ? `${day} UTC` : 'PRACTICE RUN', 1112, 99);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#d6c8dc';
  ctx.font = 'bold 23px monospace';
  ctx.fillText(game.toUpperCase(), 84, 174);
  ctx.fillStyle = accent;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 26;
  ctx.font = 'bold 89px Impact, Haettenschweiler, Arial Narrow, sans-serif';
  ctx.fillText(headline[0], 82, 272, 1020);
  ctx.fillText(headline[1], 82, 359, 1020);
  ctx.shadowBlur = 0;

  const statWidth = 328;
  stats.forEach(({ label, value }, index) => {
    const x = 84 + index * (statWidth + 25);
    ctx.fillStyle = '#251e30';
    ctx.fillRect(x, 396, statWidth, 105);
    ctx.strokeStyle = '#66516c';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 396, statWidth, 105);
    ctx.fillStyle = '#b8a9c4';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(label.toUpperCase(), x + 20, 430);
    ctx.fillStyle = '#fff5eb';
    ctx.font = 'bold 37px monospace';
    ctx.fillText(String(value), x + 20, 477, statWidth - 40);
  });

  ctx.fillStyle = '#ffad5b';
  ctx.font = 'bold 23px monospace';
  ctx.fillText('CAN YOU BEAT MY RUN?', 84, 554);
  ctx.fillStyle = '#d6c8dc';
  ctx.textAlign = 'right';
  ctx.font = '19px monospace';
  ctx.fillText(url.replace(/^https?:\/\//, ''), 1114, 554);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Result image could not be encoded')); return; }
      try {
        resolve(new File([blob], `rapid-games-${number === '001' ? 'circuit-siege' : 'ten-questions'}-result.png`, { type: 'image/png' }));
      } catch (error) { reject(error); }
    }, 'image/png');
  });
}

export async function shareResultImage({ imagePromise, title, text, url }) {
  const file = await imagePromise?.catch(() => null);
  let canShareFile = false;
  try { canShareFile = Boolean(file && navigator.share && navigator.canShare?.({ files: [file] })); }
  catch { /* Some browsers reject file capability checks. */ }
  // macOS's share-sheet Copy action does not reliably paste a photo into a web
  // post. A direct PNG clipboard write is the clearer desktop path.
  const desktopPointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;
  if (canShareFile && !desktopPointer) {
    await navigator.share({ title, text, url, files: [file] });
    return 'native-image';
  }
  if (file && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'image/png': file,
      })]);
      return 'copy-image';
    } catch { /* Some browsers can only use the native share sheet or copy text. */ }
  }
  if (canShareFile) {
    await navigator.share({ title, text, url, files: [file] });
    return 'native-image';
  }
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return 'native-link';
  }
  await navigator.clipboard.writeText(`${text}\n${url}`);
  return 'copy-text';
}
