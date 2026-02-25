const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { createJob, findJobById, getAllJobs, updateJob } = require('../models/Job');
const { createSubmission, getSubmissionsByJob, updateSubmission, findSubmissionById } = require('../models/Submission');
const { createTransaction } = require('../models/Transaction');
const { updateWallet, findUserById } = require('../models/User');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mov|avi|mkv|webm/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 }
});

// GET /jobs - list all jobs
router.get('/', (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.minBudget) filters.minBudget = req.query.minBudget;
    if (req.query.maxBudget) filters.maxBudget = req.query.maxBudget;

    const jobs = getAllJobs(Object.keys(filters).length ? filters : { status: 'open' });
    res.render('jobs', { title: 'Browse Jobs', jobs, filters: req.query });
  } catch (err) {
    console.error(err);
    res.render('jobs', { title: 'Browse Jobs', jobs: [], filters: {} });
  }
});

// GET /jobs/post - render post job form
router.get('/post', requireAuth, (req, res) => {
  res.render('post-job', { title: 'Post a Job', error: req.query.error || null, success: req.query.success || null });
});

// POST /jobs/post - create a job
router.post('/post', requireAuth, upload.single('video_file'), async (req, res) => {
  try {
    const user = req.user;
    const { title, description, instructions, budget, category, deadline, video_url } = req.body;
    const budgetNum = parseFloat(budget);

    if (!title || !description || !instructions || !budget) {
      return res.redirect('/jobs/post?error=All required fields must be filled.');
    }
    if (isNaN(budgetNum) || budgetNum <= 0) {
      return res.redirect('/jobs/post?error=Budget must be a positive number.');
    }
    if (user.wallet_balance < budgetNum) {
      return res.redirect('/jobs/post?error=Insufficient wallet balance. Please deposit funds first.');
    }

    const video_file = req.file ? req.file.filename : null;

    const job = createJob({
      owner_id: user.id,
      title,
      description,
      instructions,
      budget: budgetNum,
      category: category || 'general',
      deadline: deadline || null,
      video_url: video_url || null,
      video_file
    });

    // Deduct from owner's wallet (escrow)
    updateWallet(user.id, -budgetNum);
    createTransaction({
      user_id: user.id,
      type: 'escrow',
      amount: -budgetNum,
      description: `Escrow for job: ${title}`,
      job_id: job.id
    });

    res.redirect(`/jobs/${job.id}?success=Job posted successfully!`);
  } catch (err) {
    console.error(err);
    res.redirect('/jobs/post?error=An error occurred while posting the job.');
  }
});

// GET /jobs/:id - job detail
router.get('/:id', (req, res) => {
  try {
    const job = findJobById(req.params.id);
    if (!job) return res.status(404).render('home', { title: 'Not Found', error: 'Job not found.' });

    const submissions = getSubmissionsByJob(job.id);
    res.render('job-detail', {
      title: job.title,
      job,
      submissions,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/jobs?error=An error occurred.');
  }
});

// POST /jobs/:id/claim - editor claims job
router.post('/:id/claim', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const job = findJobById(req.params.id);

    if (!job) return res.redirect('/jobs?error=Job not found.');
    if (job.status !== 'open') return res.redirect(`/jobs/${job.id}?error=This job is no longer available.`);
    if (job.owner_id === user.id) return res.redirect(`/jobs/${job.id}?error=You cannot claim your own job.`);

    updateJob(job.id, { status: 'in_progress', editor_id: user.id });
    res.redirect(`/jobs/${job.id}?success=Job claimed! You can now submit your edited video.`);
  } catch (err) {
    console.error(err);
    res.redirect(`/jobs/${req.params.id}?error=An error occurred.`);
  }
});

// POST /jobs/:id/submit - editor submits edited video
router.post('/:id/submit', requireAuth, upload.single('video_file'), (req, res) => {
  try {
    const user = req.user;
    const job = findJobById(req.params.id);

    if (!job) return res.redirect('/jobs?error=Job not found.');
    if (job.editor_id !== user.id) return res.redirect(`/jobs/${job.id}?error=You are not the assigned editor for this job.`);
    if (job.status !== 'in_progress') return res.redirect(`/jobs/${job.id}?error=This job is not in progress.`);

    const { video_url, notes } = req.body;
    const video_file = req.file ? req.file.filename : null;

    if (!video_file && !video_url) {
      return res.redirect(`/jobs/${job.id}?error=Please provide a video file or URL.`);
    }

    createSubmission({
      job_id: job.id,
      editor_id: user.id,
      video_file,
      video_url: video_url || null,
      notes: notes || null
    });

    res.redirect(`/jobs/${job.id}?success=Submission uploaded successfully!`);
  } catch (err) {
    console.error(err);
    res.redirect(`/jobs/${req.params.id}?error=An error occurred while submitting.`);
  }
});

// POST /jobs/:id/accept-submission/:submissionId
router.post('/:id/accept-submission/:submissionId', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const job = findJobById(req.params.id);
    const submission = findSubmissionById(req.params.submissionId);

    if (!job || !submission) return res.redirect('/jobs?error=Not found.');
    if (job.owner_id !== user.id) return res.redirect(`/jobs/${job.id}?error=Unauthorized.`);
    if (submission.job_id !== job.id) return res.redirect(`/jobs/${job.id}?error=Submission does not belong to this job.`);

    const commission = job.budget * (parseFloat(process.env.PLATFORM_COMMISSION) || 0.10);
    const editorEarning = job.budget - commission;

    // Pay the editor
    updateWallet(submission.editor_id, editorEarning);
    createTransaction({
      user_id: submission.editor_id,
      type: 'earning',
      amount: editorEarning,
      description: `Payment for job: ${job.title}`,
      job_id: job.id
    });

    // Record commission - assign to admin user
    const adminUser = findUserById(require('../models/User').getAllUsers().find(u => u.role === 'admin')?.id);
    if (adminUser) {
      createTransaction({
        user_id: adminUser.id,
        type: 'commission',
        amount: commission,
        description: `Commission from job: ${job.title}`,
        job_id: job.id
      });
    }

    // Accept this submission
    updateSubmission(submission.id, { status: 'accepted' });

    // Reject all other pending submissions
    const allSubmissions = getSubmissionsByJob(job.id);
    for (const sub of allSubmissions) {
      if (sub.id !== submission.id && sub.status === 'pending') {
        updateSubmission(sub.id, { status: 'rejected', feedback: 'Another submission was accepted.' });
      }
    }

    // Complete the job
    updateJob(job.id, { status: 'completed' });

    res.redirect(`/jobs/${job.id}?success=Submission accepted and editor has been paid!`);
  } catch (err) {
    console.error(err);
    res.redirect(`/jobs/${req.params.id}?error=An error occurred.`);
  }
});

// POST /jobs/:id/reject-submission/:submissionId
router.post('/:id/reject-submission/:submissionId', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const job = findJobById(req.params.id);
    const submission = findSubmissionById(req.params.submissionId);

    if (!job || !submission) return res.redirect('/jobs?error=Not found.');
    if (job.owner_id !== user.id) return res.redirect(`/jobs/${job.id}?error=Unauthorized.`);

    const { feedback } = req.body;
    updateSubmission(submission.id, { status: 'rejected', feedback: feedback || 'Submission rejected.' });

    res.redirect(`/jobs/${job.id}?success=Submission rejected.`);
  } catch (err) {
    console.error(err);
    res.redirect(`/jobs/${req.params.id}?error=An error occurred.`);
  }
});

module.exports = router;
