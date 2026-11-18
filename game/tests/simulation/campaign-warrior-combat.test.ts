import { campaignTest } from './campaign.ts';

for (const affinity of ['fire', 'water'] as const) campaignTest('warrior', false, affinity);
