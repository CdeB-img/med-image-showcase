import { mergeConfig } from 'vitest/config';
import base from '../../vitest.config';
export default mergeConfig(base, { test: { include: ['validation/protocol-designer-v1-live-canary-01r-offline-causal-repair-01/recorded-prefix.test.tsx'], testTimeout: 20000 } });
