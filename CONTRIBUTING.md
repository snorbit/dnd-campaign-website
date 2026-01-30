# 🎮 SessionForge - Contributor Task List

## Overview
Welcome! This document lists tasks that can be done independently while the core session import feature is being developed.

---

## 🟢 Easy Tasks (Good for Getting Started)

### UI/UX Improvements

**1. Add Loading Skeletons**  - Done
- **Where**: All tabs in DM and Player views
- **What**: Replace "Loading..." text with animated skeleton loaders
- **Files**: `components/dm/*.tsx` and `components/player/*.tsx`
- **Why**: Better UX while data loads

**2. Add Toast Notifications** - Done
- **Current**: Using `alert()` for notifications
- **Goal**: Implement a toast notification system
- **Library**: Consider `react-hot-toast` or `sonner`
- **Files**: Add toast provider, replace all `alert()` calls

**3. Improve Mobile Responsiveness**
- **Where**: DM campaign page sidebar
- **What**: Make sidebar collapsible on mobile
- **File**: `app/dm/[campaignId]/page.tsx`

**4. Add Favicon and PWA Support**
- **What**: Add favicon, app icons, manifest.json
- **Files**: `public/` directory, `app/layout.tsx`

---

## 🟡 Medium Tasks (Some React/Next.js Knowledge)

### Feature Enhancements

**5. Player Character Sheet** -Done
- **What**: Create a detailed character sheet view for players
- **Features**: 
  - Stats display (HP, AC, abilities)
  - Skills and proficiencies
  - Spells known/prepared
  - Inventory management
- **File**: Create `components/player/CharacterSheet.tsx`
- **Database**: May need new tables in Supabase

**6. Dice Roller** - Done
- **What**: In-app dice rolling with animations
- **Features**:
  - Multiple dice types (d4, d6, d8, d10, d12, d20, d100)
  - Modifiers (+/- bonuses)
  - Roll history
  - Broadcast rolls to campaign
- **File**: Create `components/shared/DiceRoller.tsx`

**7. NPC Generator** - Done 
- **What**: Random NPC generator for DMs
- **Features**:
  - Random name, race, class
  - Random personality traits
  - Quick stats
- **File**: `components/dm/NPCGenerator.tsx`

**8. Initiative Tracker** - Done
- **What**: Combat initiative tracker
- **Features**:
  - Add players/monsters
  - Track turn order
  - HP tracking during combat
  - Condition/status effects
- **File**: `components/dm/InitiativeTracker.tsx`

---

## 🔴 Advanced Tasks (Database + API Work)

### Backend Features

**9. Real-time Synchronization Improvements** - Done
- **What**: Optimize real-time updates using Supabase subscriptions
- **Where**: Map changes, quest updates, item additions
- **Files**: All component files using Supabase
- **Goal**: Instant updates without page refresh

**10. Rich Text Editor for Descriptions**
- **What**: Add markdown/rich text editing
- **Where**: Quest descriptions, NPC notes, session notes
- **Library**: Consider `@tiptap/react` or `react-quill`

**11. File Upload for Custom Assets**
- **What**: Allow DMs to upload custom maps, character portraits
- **Features**:
  - Supabase Storage integration
  - Image optimization
  - Gallery view
- **Files**: Create `app/api/upload` route, update components

**12. Campaign Templates**
- **What**: Pre-built campaign templates DMs can use
- **Examples**:
  - "Lost Mine of Phandelver" starter
  - "Dungeon Crawl" template
  - "Sandbox World" template
- **Database**: Seed data with templates

---

## 🎨 Design Tasks

**13. Dark/Light Mode Toggle**
- **What**: Add theme switcher
- **Current**: Only dark mode
- **Implementation**: Use `next-themes` package

**14. Custom Color Themes**
- **What**: Let users choose accent colors
- **Options**: Purple, Blue, Green, Red themes
- **File**: Update global CSS variables

**15. Animation Improvements**
- **Where**: Landing page, tab transitions, modal animations
- **Library**: Consider `framer-motion`

---

## 📊 Data & Content

**16. Populate Standard D&D Content**
- **What**: Add standard D&D 5e data
- **Content Needed**:
  - ✅ Feats (already created script)
  - ❌ Spells database
  - ❌ Monsters/Creatures
  - ❌ Magic items
  - ❌ Conditions/statuses
- **Format**: SQL insert scripts in `/supabase/`

**17. Create Demo Campaign**
- **What**: Seed database with example campaign
- **Purpose**: New users can explore features
- **Content**: Sample quests, NPCs, maps, encounters

---

## 🧪 Testing & Quality

**18. Add Unit Tests**
- **What**: Test utility functions
- **Framework**: Jest + React Testing Library
- **Files**: Create `__tests__` directories

**19. Add E2E Tests**
- **What**: Test user flows
- **Framework**: Playwright or Cypress
- **Scenarios**:
  - Create campaign
  - Join campaign as player
  - Import session
  - Complete quest

**20. Accessibility Audit**
- **What**: Check WCAG compliance
- **Tools**: axe DevTools, Lighthouse
- **Focus**: Keyboard navigation, screen readers, color contrast

---

## 📝 Documentation

**21. Write README**
- **Sections**:
  - Setup instructions
  - Environment variables guide
  - Database schema overview
  - Deployment guide

**22. API Documentation**
- **What**: Document all API routes
- **Format**: OpenAPI/Swagger or simple markdown

**23. User Guide**
- **What**: How-to guide for DMs and players
- **Topics**:
  - Creating your first campaign
  - Inviting players
  - Running a session
  - Using maps and encounters

---

## 🚀 DevOps

**24. CI/CD Pipeline**
- **What**: Automated testing on pull requests
- **Platform**: GitHub Actions
- **Tasks**: Lint, type check, run tests

**25. Database Migrations Workflow**
- **What**: Better migration management
- **Tool**: Supabase CLI scripts
- **Goal**: Easy rollback and version control

---

## 📌 Priority Recommendations

If only tackling a few tasks, I'd recommend:

1. **#2 - Toast Notifications** (quick win, big UX improvement)
2. **#6 - Dice Roller** (fun feature, moderately complex)
3. **#8 - Initiative Tracker** (highly requested DM tool)
4. **#16 - Populate Database** (enables testing with real content)
5. **#21 - README** (helps future contributors)

---

## 💡 Getting Started

1. **Fork the repo** on GitHub
2. **Clone locally**: `git clone <your-fork>`
3. **Install dependencies**: `npm install`
4. **Copy `.env.local.example`** to `.env.local` (get Supabase keys)
5. **Run dev server**: `npm run dev`
6. **Pick a task** and create a branch
7. **Submit PR** when ready!

---

## 🤝 Questions?

- Check existing issues on GitHub
- Ask in the Discord/Slack channel
- Tag @snorbit for technical questions
