/** Animate a visual copy; the game can save the move immediately. */
export function flyNumber(source: HTMLElement, target: HTMLElement, value: number): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(to.width, to.height);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const lift = Math.min(100, Math.max(45, Math.hypot(dx, dy) * .2));
  const token = document.createElement('span');
  token.className = 'number-flight';
  token.textContent = String(value);
  token.setAttribute('aria-hidden', 'true');
  Object.assign(token.style, {
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`, height: `${size}px`,
    fontSize: getComputedStyle(target).fontSize,
  });
  document.body.appendChild(token);
  target.classList.add('flight-receiving');

  const animation = token.animate([
    { transform: 'perspective(700px) translate3d(0, 0, 0) rotateX(0) rotateY(0) scale(.85)', opacity: .85, offset: 0 },
    { transform: `perspective(700px) translate3d(${dx * .42}px, ${dy * .42 - lift}px, 100px) rotateX(18deg) rotateY(-24deg) scale(1.2)`, opacity: 1, offset: .45 },
    { transform: `perspective(700px) translate3d(${dx}px, ${dy}px, 0) rotateX(0) rotateY(0) scale(1)`, opacity: 1, offset: 1 },
  ], { duration: 560, easing: 'cubic-bezier(.22,.65,.25,1)', fill: 'forwards' });

  const cleanup = () => {
    animation.cancel();
    token.remove();
    target.classList.remove('flight-receiving');
  };
  animation.onfinish = () => {
    cleanup();
    // Animate the surface independently so board selection keeps its transform.
    target.animate([
      { boxShadow: 'inset 0 0 0 2px #90b49b, 0 0 0 0 rgba(83,112,88,.4)' },
      { boxShadow: 'inset 0 0 0 2px #90b49b, 0 0 0 9px rgba(83,112,88,0)', offset: .65 },
      { boxShadow: getComputedStyle(target).boxShadow },
    ], { duration: 320, easing: 'ease-out' });
  };
  return cleanup;
}
