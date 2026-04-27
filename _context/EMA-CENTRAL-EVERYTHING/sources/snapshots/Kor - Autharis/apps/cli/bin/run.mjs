#!/usr/bin/env node
// Autharis CLI launcher (POSIX). Lane G2.
import { execute } from '@oclif/core';

await execute({ dir: import.meta.url });
