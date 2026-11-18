import { campaignTest } from './campaign.ts';

for (const affinity of ['fire', 'water', 'earth', 'air'] as const) campaignTest('mage', true, affinity);
