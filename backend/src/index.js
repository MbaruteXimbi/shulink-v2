require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { runMigrations } = require('./migrations/schema');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', require('./routes/index'));

app.get('/health', (req, res) => res.json({
  status: 'ok', product: 'Shulink', version: '2.0.0',
  by: 'MilleHills Ltd', time: new Date().toISOString(),
}));

app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large' });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5010;

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🔗 Shulink API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  })
  .catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
