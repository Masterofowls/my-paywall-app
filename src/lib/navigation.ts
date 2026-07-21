// src/lib/navigation.ts
export function navigateTo(url: string) {
  window.location.href = url;
}

export function reloadPage() {
  window.location.reload();
}
