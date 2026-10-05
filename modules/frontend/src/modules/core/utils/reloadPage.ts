/** Recarga la página (módulo propio para poder simularlo en los tests: jsdom no deja espiar `location.reload`). */
export function reloadPage(): void {
  window.location.reload();
}
