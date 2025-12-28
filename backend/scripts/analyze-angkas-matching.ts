/**
 * Script to analyze PDF puskesmas name matching
 * Run: npx tsx scripts/analyze-angkas-matching.ts
 */

import { parseAngkasPdf, findPuskesmasUser } from '../src/services/angkasParserService';
import User from '../src/models/User';
import sequelize from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function analyzeMatching() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Read PDF
    const pdfPath = path.join(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log('📄 Parsing PDF...');
    const parsed = await parseAngkasPdf(pdfBuffer);
    
    console.log(`📋 Found ${parsed.puskesmasList.length} puskesmas in PDF\n`);
    
    // Get all puskesmas users from database
    const puskesmasUsers = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'nama', 'username'],
      raw: true,
    });
    
    console.log(`👥 Found ${puskesmasUsers.length} puskesmas users in database\n`);
    
    // Analyze matching
    const matched: string[] = [];
    const unmatched: string[] = [];
    const matchedDetails: Array<{pdf: string; db: string; username: string}> = [];
    
    for (const p of parsed.puskesmasList) {
      const userId = findPuskesmasUser(
        p.namaPuskesmas,
        puskesmasUsers.map(u => ({ id: u.id, nama: u.nama, username: u.username }))
      );
      
      if (userId) {
        const user = puskesmasUsers.find(u => u.id === userId);
        matched.push(p.namaPuskesmas);
        matchedDetails.push({
          pdf: p.namaPuskesmas,
          db: user?.nama || '',
          username: user?.username || '',
        });
      } else {
        unmatched.push(p.namaPuskesmas);
      }
    }
    
    console.log('='.repeat(60));
    console.log('✅ MATCHED PUSKESMAS (' + matched.length + ')');
    console.log('='.repeat(60));
    matchedDetails.slice(0, 10).forEach((m, i) => {
      console.log(`${i+1}. PDF: "${m.pdf}" → DB: "${m.db}" (${m.username})`);
    });
    if (matchedDetails.length > 10) {
      console.log(`... and ${matchedDetails.length - 10} more`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('❌ UNMATCHED PUSKESMAS (' + unmatched.length + ')');
    console.log('='.repeat(60));
    unmatched.forEach((name, i) => {
      // Show the normalized name for debugging
      const normalized = name.toLowerCase().replace('puskesmas', '').trim();
      console.log(`${i+1}. "${name}" → normalized: "${normalized}"`);
      
      // Try to find close matches
      const closeMatches = puskesmasUsers.filter(u => {
        const userName = u.nama.toLowerCase();
        const userUsername = u.username.toLowerCase();
        return userName.includes(normalized.substring(0, 4)) || 
               normalized.includes(userName.substring(0, 4)) ||
               userUsername.includes(normalized.substring(0, 4));
      });
      
      if (closeMatches.length > 0) {
        console.log(`   Possible matches: ${closeMatches.map(u => u.nama + ' (' + u.username + ')').join(', ')}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total in PDF: ${parsed.puskesmasList.length}`);
    console.log(`Matched: ${matched.length}`);
    console.log(`Unmatched: ${unmatched.length}`);
    console.log(`Match rate: ${((matched.length / parsed.puskesmasList.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

analyzeMatching();
