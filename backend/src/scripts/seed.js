// Builds the sample college by hand: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../database/database.js';
import { DEMO_LOGINS, DEMO_PASSWORD, ensureAdmin, ensureDoctor, rebuildSampleCollege } from './sampleCollege.js';

const seed = async () => {
    await connectDB();

    if (await ensureAdmin()) {
        console.log('Admin account created from ADMIN_EMAIL');
    }

    if (await ensureDoctor()) {
        console.log('Doctor account created from DOCTOR_EMAIL');
    }

    const { users } = await rebuildSampleCollege();

    console.log(`\nSample college rebuilt: ${users} accounts.`);
    console.log(`Password for every demo account: ${DEMO_PASSWORD}\n`);
    Object.entries(DEMO_LOGINS).forEach(([role, email]) => console.log(`  ${role.padEnd(8)} ${email}`));
};

seed()
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
        console.log('Seeding failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    });
