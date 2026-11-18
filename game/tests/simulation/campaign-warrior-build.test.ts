import { campaignTest } from './campaign.ts';

for (const affinity of ['fire', 'water', 'earth', 'air'] as const) campaignTest('warrior', true, affinity);
