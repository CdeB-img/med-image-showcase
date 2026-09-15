import { mergeConfig } from 'vitest/config';
import base from '../../vitest.config';
export default mergeConfig(base, { test: { include: ['validation/protocol-designer-v1-multi-scenario-live-causal-repair-01/*.test.{ts,tsx}'], testTimeout: 120000, fileParallelism: false } });
