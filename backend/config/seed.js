require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('../models/Expert');
const connectDB = require('./db');

const experts = [
  {
    name: 'Dr. Aisha Patel',
    category: 'Technology',
    specialization: 'AI & Machine Learning',
    experience: 12,
    rating: 4.9,
    reviewCount: 234,
    bio: 'Former Google AI researcher with 12 years of experience in building production ML systems. Published author of 3 books on deep learning.',
    avatar: 'https://i.pravatar.cc/300?img=47',
    hourlyRate: 250,
    tags: ['Machine Learning', 'Python', 'TensorFlow', 'Computer Vision'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Marcus Chen',
    category: 'Finance',
    specialization: 'Investment Strategy',
    experience: 15,
    rating: 4.8,
    reviewCount: 189,
    bio: 'Ex-Goldman Sachs portfolio manager specializing in emerging markets and alternative investments. MBA from Wharton.',
    avatar: 'https://i.pravatar.cc/300?img=68',
    hourlyRate: 300,
    tags: ['Portfolio Management', 'Hedge Funds', 'Crypto', 'Risk Analysis'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Sofia Andersson',
    category: 'Design',
    specialization: 'UX/Product Design',
    experience: 9,
    rating: 4.95,
    reviewCount: 312,
    bio: 'Award-winning product designer who led design at Spotify and Figma. Specializes in design systems and user research.',
    avatar: 'https://i.pravatar.cc/300?img=45',
    hourlyRate: 200,
    tags: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. James Okafor',
    category: 'Health',
    specialization: 'Sports Medicine',
    experience: 20,
    rating: 4.85,
    reviewCount: 421,
    bio: 'Olympic team physician with 20 years in sports medicine. Specialized in performance optimization and injury prevention.',
    avatar: 'https://i.pravatar.cc/300?img=60',
    hourlyRate: 350,
    tags: ['Sports Medicine', 'Nutrition', 'Rehabilitation', 'Performance'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Elena Volkov',
    category: 'Legal',
    specialization: 'Startup & IP Law',
    experience: 11,
    rating: 4.7,
    reviewCount: 156,
    bio: 'Startup attorney who has helped 200+ companies raise $500M+ in funding. Expert in IP protection and term sheets.',
    avatar: 'https://i.pravatar.cc/300?img=49',
    hourlyRate: 400,
    tags: ['IP Law', 'Contracts', 'Fundraising', 'Term Sheets'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Raj Krishnamurthy',
    category: 'Technology',
    specialization: 'Cloud Architecture',
    experience: 14,
    rating: 4.88,
    reviewCount: 278,
    bio: 'AWS Solutions Architect with expertise in building scalable distributed systems. Previously at Amazon and Netflix.',
    avatar: 'https://i.pravatar.cc/300?img=57',
    hourlyRate: 275,
    tags: ['AWS', 'Kubernetes', 'Microservices', 'DevOps'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Amara Diallo',
    category: 'Marketing',
    specialization: 'Growth & Brand Strategy',
    experience: 8,
    rating: 4.75,
    reviewCount: 198,
    bio: 'Growth strategist who scaled 3 startups from 0 to $50M ARR. Expert in performance marketing and brand positioning.',
    avatar: 'https://i.pravatar.cc/300?img=44',
    hourlyRate: 225,
    tags: ['Growth Hacking', 'SEO', 'Paid Media', 'Brand Strategy'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Dr. Wei Zhang',
    category: 'Health',
    specialization: 'Mental Health & Coaching',
    experience: 16,
    rating: 4.92,
    reviewCount: 389,
    bio: 'Licensed psychologist and executive coach. Specializes in high-performance mindset, burnout prevention, and leadership development.',
    avatar: 'https://i.pravatar.cc/300?img=56',
    hourlyRate: 280,
    tags: ['Executive Coaching', 'Mindfulness', 'Leadership', 'CBT'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Lena Hoffmann',
    category: 'Finance',
    specialization: 'Personal Finance & FIRE',
    experience: 7,
    rating: 4.65,
    reviewCount: 145,
    bio: 'Certified financial planner specializing in helping professionals achieve financial independence. Author of bestselling FIRE guide.',
    avatar: 'https://i.pravatar.cc/300?img=46',
    hourlyRate: 175,
    tags: ['FIRE Movement', 'Tax Planning', 'Retirement', 'Investing'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Carlos Mendez',
    category: 'Marketing',
    specialization: 'Content & Social Media',
    experience: 6,
    rating: 4.6,
    reviewCount: 112,
    bio: 'Built content strategies for brands with 10M+ followers. Expert in viral content creation and community building.',
    avatar: 'https://i.pravatar.cc/300?img=51',
    hourlyRate: 150,
    tags: ['Content Strategy', 'TikTok', 'Instagram', 'Community Building'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Priya Sharma',
    category: 'Legal',
    specialization: 'Employment Law',
    experience: 13,
    rating: 4.72,
    reviewCount: 167,
    bio: 'Employment attorney specializing in workplace discrimination, wrongful termination, and HR compliance for startups.',
    avatar: 'https://i.pravatar.cc/300?img=48',
    hourlyRate: 350,
    tags: ['Employment Law', 'HR Compliance', 'Discrimination', 'Labor Law'],
    availableSlots: generateSlots(),
  },
  {
    name: 'Noah Fitzgerald',
    category: 'Design',
    specialization: 'Brand Identity',
    experience: 10,
    rating: 4.8,
    reviewCount: 224,
    bio: 'Brand designer behind identities for 50+ Fortune 500 companies. Passionate about creating visual languages that transcend trends.',
    avatar: 'https://i.pravatar.cc/300?img=61',
    hourlyRate: 220,
    tags: ['Brand Identity', 'Logo Design', 'Typography', 'Visual Systems'],
    availableSlots: generateSlots(),
  },
];

function generateSlots() {
  const slots = [];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  for (let d = 1; d <= 14; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    times.forEach((time) => {
      slots.push({
        date: dateStr,
        time,
        isBooked: false,
        bookedBy: null,
      });
    });
  }

  return slots;
}

async function seed() {
  await connectDB();
  try {
    await Expert.deleteMany({});
    await Expert.insertMany(experts);
    console.log(`✅ Seeded ${experts.length} experts successfully`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    mongoose.disconnect();
  }
}

seed();
