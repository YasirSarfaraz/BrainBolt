#!/usr/bin/env node
import { refillAllPools, getPoolStats } from '../src/lib/question-pool';

async function main() {
    console.log('🤖 BrainBolt Question Pool Manager\n');

    const command = process.argv[2];

    if (command === 'refill') {
        console.log('Starting pool refill...\n');
        await refillAllPools();
    } else if (command === 'stats') {
        console.log('📊 Current Pool Statistics:\n');
        const stats = await getPoolStats();
        
        console.log('Difficulty | AI Questions | Seed Questions | Total');
        console.log('-----------|--------------|----------------|------');
        
        for (let i = 1; i <= 10; i++) {
            const { ai, seed } = stats[i];
            const total = ai + seed;
            console.log(`    ${i}      |      ${ai.toString().padStart(2, ' ')}      |       ${seed.toString().padStart(2, ' ')}       |  ${total.toString().padStart(2, ' ')}`);
        }
        
        const totalAi = Object.values(stats).reduce((sum, s) => sum + s.ai, 0);
        const totalSeed = Object.values(stats).reduce((sum, s) => sum + s.seed, 0);
        console.log('-----------|--------------|----------------|------');
        console.log(`   Total   |     ${totalAi.toString().padStart(3, ' ')}      |      ${totalSeed.toString().padStart(3, ' ')}       | ${(totalAi + totalSeed).toString().padStart(3, ' ')}`);
    } else {
        console.log('Usage:');
        console.log('  npm run pool:refill  - Pre-generate AI questions for all difficulty levels');
        console.log('  npm run pool:stats   - Show current question pool statistics');
    }
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
