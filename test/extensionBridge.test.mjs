import test from 'node:test';
import assert from 'node:assert/strict';
import { isExtensionContextInvalidated } from '../src/lib/extensionBridge.js';

test('拡張更新で無効化されたBridgeだけを安全な再読込対象にする', () => {
  assert.equal(isExtensionContextInvalidated({ code: 'extension_error', message: 'Extension context invalidated.' }), true);
  assert.equal(isExtensionContextInvalidated({ code: 'extension_error', message: '専用Chrome拡張から応答がありません' }), false);
  assert.equal(isExtensionContextInvalidated({ code: 'apple_ui_unavailable', message: 'Extension context invalidated.' }), false);
});
