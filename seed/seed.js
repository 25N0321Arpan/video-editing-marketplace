require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { initDB, db } = require('../config/database');
const { createUser, findUserByEmail } = require('../models/User');
const { createJob } = require('../models/Job');
const { createSubmission } = require('../models/Submission');
const { createTransaction } = require('../models/Transaction');
const { updateWallet } = require('../models/User');
const { updateJob } = require('../models/Job');
const { updateSubmission } = require('../models/Submission');

async function seed() {
  console.log('🌱 Initializing database...');
  await initDB();

  console.log('🧹 Clearing existing data...');
  db.exec('DELETE FROM transactions; DELETE FROM submissions; DELETE FROM jobs; DELETE FROM users;');

  console.log('👤 Creating users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = createUser({
    email: 'admin@videomarket.com',
    password: adminPassword,
    name: 'Admin User',
    role: 'admin',
    wallet_balance: 1000
  });
  console.log('  ✓ Admin:', admin.email);

  // Video Owners
  const owner1 = createUser({
    email: 'sarah@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Sarah Johnson',
    role: 'owner',
    bio: 'YouTuber and content creator with 500k subscribers',
    wallet_balance: 500
  });

  const owner2 = createUser({
    email: 'mike@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Mike Chen',
    role: 'owner',
    bio: 'Wedding videographer needing post-production help',
    wallet_balance: 750
  });

  const owner3 = createUser({
    email: 'emma@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Emma Williams',
    role: 'owner',
    bio: 'Small business owner creating product videos',
    wallet_balance: 300
  });

  console.log('  ✓ 3 Video Owners created');

  // Video Editors
  const editor1 = createUser({
    email: 'alex@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Alex Rivera',
    role: 'editor',
    bio: 'Professional video editor with 8 years of experience in YouTube and corporate videos',
    portfolio: 'https://alexrivera-portfolio.example.com',
    wallet_balance: 250
  });

  const editor2 = createUser({
    email: 'priya@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Priya Patel',
    role: 'editor',
    bio: 'Specializing in wedding and event videos. Adobe Premiere Pro expert',
    portfolio: 'https://priyapatel-edits.example.com',
    wallet_balance: 180
  });

  const editor3 = createUser({
    email: 'james@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'James Wilson',
    role: 'editor',
    bio: 'Motion graphics and social media content specialist',
    portfolio: 'https://jameswilson-creates.example.com',
    wallet_balance: 90
  });

  console.log('  ✓ 3 Video Editors created');

  console.log('💼 Creating jobs...');

  // Job 1: Open
  const job1 = createJob({
    owner_id: owner1.id,
    title: 'Edit 15-minute YouTube Gaming Video',
    description: 'I need a professional editor to cut down a 1-hour gaming session into a 15-minute highlight video with engaging transitions and commentary overlays.',
    instructions: 'Cut out boring parts, add zooms to exciting moments, include an intro/outro template, add subtitles for commentary, color grade for a cinematic look.',
    budget: 120,
    category: 'youtube',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    video_url: 'https://drive.google.com/example/gaming-raw-footage'
  });
  updateWallet(owner1.id, -120);
  createTransaction({ user_id: owner1.id, type: 'escrow', amount: -120, description: 'Escrow for job: Edit 15-minute YouTube Gaming Video', job_id: job1.id });

  // Job 2: Open
  const job2 = createJob({
    owner_id: owner2.id,
    title: 'Wedding Highlight Video - 4 minute reel',
    description: 'Create a beautiful 4-minute wedding highlight reel from 6 hours of raw footage. Romantic style with emotional music sync.',
    instructions: 'Use Adobe Premiere or Resolve. Include ceremony highlights, first dance, speeches. Sync to provided music tracks. Export in 4K.',
    budget: 250,
    category: 'wedding',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    video_url: 'https://drive.google.com/example/wedding-footage'
  });
  updateWallet(owner2.id, -250);
  createTransaction({ user_id: owner2.id, type: 'escrow', amount: -250, description: 'Escrow for job: Wedding Highlight Video - 4 minute reel', job_id: job2.id });

  // Job 3: In Progress (claimed by editor1)
  const job3 = createJob({
    owner_id: owner1.id,
    title: 'Product Launch Video for Startup',
    description: 'Need a 90-second product explainer video edited from raw footage with motion graphics and professional color grading.',
    instructions: 'Add animated text overlays, logo animation at start/end, background music (provided), color correction, and export in 1080p MP4.',
    budget: 180,
    category: 'corporate',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    video_url: 'https://drive.google.com/example/product-footage'
  });
  updateWallet(owner1.id, -180);
  createTransaction({ user_id: owner1.id, type: 'escrow', amount: -180, description: 'Escrow for job: Product Launch Video for Startup', job_id: job3.id });
  updateJob(job3.id, { status: 'in_progress', editor_id: editor1.id });

  // Job 4: In Progress (claimed by editor2)
  const job4 = createJob({
    owner_id: owner3.id,
    title: 'Instagram Reels - 5 short videos',
    description: 'Edit 5 x 30-second Instagram reels from raw cooking footage. Trendy cuts, captions, and background music.',
    instructions: 'Vertical format (9:16), add trending music from provided list, text overlays with recipe steps, fast-paced dynamic editing.',
    budget: 95,
    category: 'social-media',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    video_url: 'https://drive.google.com/example/cooking-reels'
  });
  updateWallet(owner3.id, -95);
  createTransaction({ user_id: owner3.id, type: 'escrow', amount: -95, description: 'Escrow for job: Instagram Reels - 5 short videos', job_id: job4.id });
  updateJob(job4.id, { status: 'in_progress', editor_id: editor2.id });

  // Job 5: Completed
  const job5 = createJob({
    owner_id: owner2.id,
    title: 'Corporate Training Video Edit',
    description: 'Edit a 20-minute corporate training video. Clean cuts, lower thirds, and professional presentation.',
    instructions: 'Remove all mistakes and pauses, add lower thirds for speaker names, insert company logo, export in 1080p.',
    budget: 150,
    category: 'corporate',
    video_url: 'https://drive.google.com/example/training-footage'
  });
  updateWallet(owner2.id, -150);
  createTransaction({ user_id: owner2.id, type: 'escrow', amount: -150, description: 'Escrow for job: Corporate Training Video Edit', job_id: job5.id });
  updateJob(job5.id, { status: 'completed', editor_id: editor3.id });

  // Add submission and transactions for completed job
  const sub5 = createSubmission({
    job_id: job5.id,
    editor_id: editor3.id,
    video_url: 'https://drive.google.com/example/completed-training',
    notes: 'All edits completed as specified. Exported in 1080p with all lower thirds and logo animation.'
  });
  updateSubmission(sub5.id, { status: 'accepted' });

  const commission5 = job5.budget * 0.10;
  const earning5 = job5.budget - commission5;
  updateWallet(editor3.id, earning5);
  createTransaction({ user_id: editor3.id, type: 'earning', amount: earning5, description: 'Payment for job: Corporate Training Video Edit', job_id: job5.id });
  createTransaction({ user_id: admin.id, type: 'commission', amount: commission5, description: 'Commission from job: Corporate Training Video Edit', job_id: job5.id });

  // Job 6: Open
  const job6 = createJob({
    owner_id: owner3.id,
    title: 'Music Video - 3 minute indie track',
    description: 'Need an editor to create a visually stunning music video from concert and B-roll footage for an indie band.',
    instructions: 'Sync cuts to the beat, color grade for moody atmosphere, add some subtle effects, create seamless transitions. 1080p or 4K output.',
    budget: 200,
    category: 'music-video',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    video_url: 'https://drive.google.com/example/music-footage'
  });
  updateWallet(owner3.id, -200);
  createTransaction({ user_id: owner3.id, type: 'escrow', amount: -200, description: 'Escrow for job: Music Video - 3 minute indie track', job_id: job6.id });

  // Add a pending submission to job3
  createSubmission({
    job_id: job3.id,
    editor_id: editor1.id,
    video_url: 'https://drive.google.com/example/product-edited-v1',
    notes: 'First version complete. Added all requested motion graphics and color grading. Please review and let me know if any adjustments needed.'
  });

  console.log('  ✓ 6 Jobs created (2 open, 2 in progress, 1 completed, 1 open)');
  console.log('  ✓ Sample submissions and transactions added');

  console.log('\n✅ Seed data created successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Admin:   admin@videomarket.com / admin123');
  console.log('  Owner:   sarah@example.com / password123 ($' + (500 - 120 - 180) + ' balance)');
  console.log('  Owner:   mike@example.com / password123 ($' + (750 - 250 - 150) + ' balance)');
  console.log('  Owner:   emma@example.com / password123 ($' + (300 - 95 - 200) + ' balance)');
  console.log('  Editor:  alex@example.com / password123');
  console.log('  Editor:  priya@example.com / password123');
  console.log('  Editor:  james@example.com / password123 ($' + (90 + earning5) + ' balance)');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
