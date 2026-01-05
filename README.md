# 🎲 D&D Campaign Platform - README

A complete **virtual tabletop platform** for running D&D 5e campaigns online!

## ✨ Features

### For Dungeon Masters:
- 📝 **Campaign Management** - Create and manage multiple campaigns
- 🗺️ **Map Display** - Upload and show maps to players in real-time
- ⚔️ **Encounter Builder** - Create encounters with reset functionality
- 👥 **Player Management** - View all player stats and grant levels
- 🎯 **Quest Tracking** - Create and manage campaign quests
- 🧙 **NPC Database** - Keep track of all NPCs
- 📦 **Item Library** - Manage campaign items
- ⭐ **Homebrew Feats** - Create custom feats for your campaign

### For Players:
- 🗺️ **Live Map** - See the current map in real-time
- 📊 **Character Stats** - Full character sheet with abilities and HP
- 🎒 **Inventory** - Manage your character's items
- 👥 **Party View** - See all party members and their status
- 📜 **Quest Log** - Track active and completed quests  
- ⭐ **Feats Browser** - View all D&D 5e feats + campaign homebrew
- 🆙 **Level-Up System** - Choose between feat or ASI when leveling up

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/snorbit/dnd-campaign-website.git
   cd dnd-campaign-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## 📚 Full Deployment Guide

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete setup instructions including:
- Supabase project creation
- Database migration
- Environment variables
- Vercel deployment

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS  
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel

## 📁 Project Structure

```
dnd-campaign-website/
├── app/
│   ├── auth/          # Authentication pages
│   ├── campaigns/     # Campaign dashboard
│   ├── dm/           # DM campaign view
│   └── player/       # Player campaign view
├── components/
│   ├── dm/           # DM tab components
│   └── player/       # Player tab components
├── lib/              # Utilities and Supabase client
├── supabase/
│   └── migrations/   # Database schema
└── public/           # Static assets
```

## 🎮 How to Use

### Creating a Campaign (DM)
1. Sign up for an account
2. Click "Create New Campaign"
3. Enter campaign name and description
4. Share the campaign with players

### Joining a Campaign (Player)
1. Sign up for an account
2. Get campaign ID from your DM
3. Join the campaign
4. Create your character

### Running a Session (DM)
1. Open your campaign
2. Go to **Maps** tab to display a map
3. Use **Encounters** tab to create battles
4. Track party progress in **Players** tab
5. Grant levels when appropriate

### Playing (Player)
1. Open your campaign
2. View the map your DM displays
3. Check your stats and inventory
4. When you level up, choose Feat or ASI!

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Campaign-specific data isolation
- Secure authentication with Supabase
- Environment variables for sensitive data

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 🎲 Have Fun!

Built with ❤️ for the D&D community. May your rolls be high and your adventures epic!
