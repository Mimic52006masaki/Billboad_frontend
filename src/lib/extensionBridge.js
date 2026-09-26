const SOURCE = 'billboard-app';
const RESPONSE_SOURCE = 'billboard-companion';

export const COMMANDS = Object.freeze({
  CHECK_ENVIRONMENT: 'CHECK_ENVIRONMENT',
  OPEN_SEARCH: 'OPEN_SEARCH',
  READ_CANDIDATES: 'READ_CANDIDATES',
  ADD_CONFIRMED_TRACK: 'ADD_CONFIRMED_TRACK',
  VERIFY_PLAYLIST: 'VERIFY_PLAYLIST',
  CLOSE_WORK_TAB: 'CLOSE_WORK_TAB',
});

// Chrome invalidates content-script contexts immediately after an unpacked
// extension is reloaded. The updater page itself must then be reloaded before
// it can talk to the freshly loaded bridge again.
export function isExtensionContextInvalidated(error) {
  return error?.code === 'extension_error' && /extension context invalidated/i.test(error.message || '');
}

export function extensionRequest(type, payload = {}, timeoutMs = 15000) {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', receive);
      reject(new Error('専用Chrome拡張から応答がありません'));
    }, timeoutMs);

    function receive(event) {
      if (event.source !== window || event.data?.source !== RESPONSE_SOURCE || event.data?.requestId !== requestId) return;
      window.clearTimeout(timer);
      window.removeEventListener('message', receive);
      if (event.data.ok) resolve(event.data.data);
      else reject(Object.assign(new Error(event.data.error?.message || '拡張機能の操作に失敗しました'), { code: event.data.error?.code }));
    }

    window.addEventListener('message', receive);
    window.postMessage({ source: SOURCE, requestId, type, payload }, window.location.origin);
  });
}
