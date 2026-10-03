// must stay first: ES imports are hoisted, and the modules below read process.env
import 'dotenv/config';
import connectDB from './database/database.js';
import app from './app.js';
import { ensureAdmin, startSampleCollege } from './scripts/sampleCollege.js';

connectDB().then(async () => {
    await ensureAdmin();

    // visitors change the sample college while trying things out; a fresh start puts it back
    if (process.env.SEED_ON_START === 'true') {
        await startSampleCollege();
    }

    app.listen(process.env.PORT || 3002, process.env.SERVER_HOST, () => {
        console.log(`Server is running at on : http://${process.env.SERVER_HOST}:${process.env.PORT}`);
    })
}).catch((err) => {
    console.log('Server failed to start:', err);
    process.exit(1);
});
