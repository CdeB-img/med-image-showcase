import { mergeConfig } from 'vitest/config';
import base from '../../vitest.config';
export default mergeConfig(base, { test: { include: ['validation/protocol-designer-v1-functional-convergence-01/*.test.tsx'], testTimeout: 120000, fileParallelism: false } });
