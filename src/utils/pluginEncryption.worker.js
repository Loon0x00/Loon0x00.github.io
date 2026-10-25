import {handlePluginEncryptionMessage} from './pluginEncryptionWorker.mjs';

// Worker 协议入口；实际处理逻辑仅发布混淆产物。
self.onmessage = handlePluginEncryptionMessage;
