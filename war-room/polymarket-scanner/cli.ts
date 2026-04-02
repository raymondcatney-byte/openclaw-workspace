#!/usr/bin/env node
import { Command } from 'commander';
import { PolymarketScanner, ArbitrageOpportunity, Inefficiency, Whale } from './scanner';
import chalk from 'chalk';
import Table from 'cli-table3';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

// Initialize scanner
const scanner = new PolymarketScanner(
  process.env.POLYMARKET_API_KEY || '',
  process.env.POLYMARKET_SECRET || '',
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

program
  .name('polymarket-alpha')
  .description('Polymarket Alpha Scanner - Find arbitrage and inefficiencies')
  .version('1.0.0');

// Arbitrage command
program
  .command('arb')
  .description('Find arbitrage opportunities (YES + NO < $1.00)')
  .option('-m, --min-edge <number>', 'Minimum edge percentage', '0.5')
  .option('-l, --min-liquidity <number>', 'Minimum liquidity USD', '10000')
  .option('-w, --watch', 'Watch mode - continuous updates')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n🔍 Polymarket Arbitrage Scanner\n'));
    
    const runScan = async () => {
      try {
        const opportunities = await scanner.detectArbitrage();
        
        if (opportunities.length === 0) {
          console.log(chalk.yellow('No arbitrage opportunities found above threshold.'));
          return;
        }

        const table = new Table({
          head: [
            chalk.bold('Market'),
            chalk.bold('YES'),
            chalk.bold('NO'),
            chalk.bold('Sum'),
            chalk.bold('Edge'),
            chalk.bold('Profit/$100'),
            chalk.bold('Liquidity'),
          ],
          colWidths: [40, 8, 8, 8, 8, 12, 12],
        });

        opportunities.forEach((opp: ArbitrageOpportunity) => {
          const edgeColor = opp.edge > 0.02 ? chalk.green : opp.edge > 0.01 ? chalk.yellow : chalk.gray;
          
          table.push([
            opp.question.substring(0, 37) + (opp.question.length > 37 ? '...' : ''),
            opp.yesPrice.toFixed(3),
            opp.noPrice.toFixed(3),
            opp.sum.toFixed(3),
            edgeColor(`${(opp.edge * 100).toFixed(2)}%`),
            chalk.green(`$${opp.potentialProfit.toFixed(2)}`),
            `$${(opp.liquidity / 1000).toFixed(1)}k`,
          ]);
        });

        console.log(table.toString());
        console.log(chalk.gray(`\nFound ${opportunities.length} opportunities | Last updated: ${new Date().toLocaleTimeString()}`));
        
      } catch (error) {
        console.error(chalk.red('Error scanning for arbitrage:'), error);
      }
    };

    await runScan();
    
    if (options.watch) {
      console.log(chalk.blue('\n👀 Watching for new opportunities (30s intervals)...\n'));
      setInterval(runScan, 30000);
    }
  });

// Whales command
program
  .command('whales')
  .description('Track high-performing whale wallets')
  .option('-t, --top <number>', 'Number of whales to show', '10')
  .option('-c, --category <string>', 'Filter by category expertise')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n🐋 Polymarket Whale Tracker\n'));
    
    try {
      const whales = await scanner.identifyWhales();
      const topWhales = whales.slice(0, parseInt(options.top));
      
      if (topWhales.length === 0) {
        console.log(chalk.yellow('No whales detected.'));
        return;
      }

      const table = new Table({
        head: [
          chalk.bold('Rank'),
          chalk.bold('Address'),
          chalk.bold('Volume'),
          chalk.bold('Win Rate'),
          chalk.bold('P&L'),
          chalk.bold('Markets'),
          chalk.bold('Expertise'),
        ],
        colWidths: [6, 14, 12, 10, 12, 10, 20],
      });

      topWhales.forEach((whale: Whale, index: number) => {
        const pnlColor = whale.profitLoss > 0 ? chalk.green : chalk.red;
        const topCategory = Object.entries(whale.categoryExpertise)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';
        
        table.push([
          `#${index + 1}`,
          `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`,
          `$${(whale.totalVolume / 1000).toFixed(1)}k`,
          `${(whale.winRate * 100).toFixed(1)}%`,
          pnlColor(`${whale.profitLoss > 0 ? '+' : ''}$${whale.profitLoss.toFixed(0)}`),
          whale.marketsTraded.toString(),
          topCategory,
        ]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`\nTracking ${whales.length} whales with >$100k volume`));
      
    } catch (error) {
      console.error(chalk.red('Error tracking whales:'), error);
    }
  });

// Inefficiencies command
program
  .command('inefficiencies')
  .description('Find market inefficiencies and mispricings')
  .option('-s, --severity <string>', 'Minimum severity (LOW/MEDIUM/HIGH)', 'MEDIUM')
  .option('-w, --watch', 'Watch mode')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n⚡ Polymarket Inefficiency Scanner\n'));
    
    const runScan = async () => {
      try {
        const inefficiencies = await scanner.detectInefficiencies();
        
        const severityFilter = options.severity.toUpperCase();
        const severityMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        const minSeverity = severityMap[severityFilter] || 2;
        
        const filtered = inefficiencies.filter((i: Inefficiency) => 
          severityMap[i.severity] >= minSeverity
        );

        if (filtered.length === 0) {
          console.log(chalk.yellow('No inefficiencies found above threshold.'));
          return;
        }

        filtered.forEach((ineff: Inefficiency) => {
          const severityColor = ineff.severity === 'HIGH' ? chalk.red : 
                               ineff.severity === 'MEDIUM' ? chalk.yellow : chalk.gray;
          
          console.log(chalk.bold(`${severityColor(`[${ineff.severity}]`)} ${ineff.type}`));
          console.log(chalk.white(ineff.question.substring(0, 70)));
          console.log(chalk.gray(ineff.description));
          console.log(chalk.blue(`Expected Value: +${(ineff.expectedValue * 100).toFixed(2)}% | Confidence: ${(ineff.confidence * 100).toFixed(0)}%`));
          console.log(chalk.gray(`Indicators: ${ineff.indicators.join(', ')}`));
          console.log('');
        });

        console.log(chalk.gray(`Found ${filtered.length} inefficiencies (${inefficiencies.length} total)`));
        
      } catch (error) {
        console.error(chalk.red('Error scanning inefficiencies:'), error);
      }
    };

    await runScan();
    
    if (options.watch) {
      console.log(chalk.blue('\n👀 Watching for new inefficiencies (60s intervals)...\n'));
      setInterval(runScan, 60000);
    }
  });

// Signals command - combines everything
program
  .command('signals')
  .description('Show all alpha signals (arb + whales + inefficiencies)')
  .option('-i, --interval <number>', 'Update interval in seconds', '30')
  .action(async (options) => {
    console.log(chalk.bold.magenta('\n🎯 Polymarket Alpha Signals\n'));
    
    const runFullScan = async () => {
      console.clear();
      console.log(chalk.bold.magenta('\n🎯 Polymarket Alpha Signals\n'));
      console.log(chalk.gray(`Last updated: ${new Date().toLocaleString()}\n`));

      try {
        // Fetch all markets once
        const markets = await scanner.fetchMarkets();
        
        // 1. Arbitrage
        console.log(chalk.bold.blue('💰 Arbitrage Opportunities\n'));
        const arbs = await scanner.detectArbitrage(markets);
        if (arbs.length > 0) {
          arbs.slice(0, 5).forEach((arb: ArbitrageOpportunity) => {
            const edgeColor = arb.edge > 0.02 ? chalk.green : chalk.yellow;
            console.log(`${edgeColor(`${(arb.edge * 100).toFixed(2)}% edge`)} | ${arb.question.substring(0, 50)}...`);
            console.log(chalk.gray(`  YES: $${arb.yesPrice.toFixed(3)} | NO: $${arb.noPrice.toFixed(3)} | Profit/$100: $${arb.potentialProfit.toFixed(2)}`));
          });
        } else {
          console.log(chalk.gray('No arbitrage opportunities above threshold.'));
        }

        // 2. Top Inefficiencies
        console.log(chalk.bold.yellow('\n⚡ Top Inefficiencies\n'));
        const ineffs = await scanner.detectInefficiencies(markets);
        const highIneffs = ineffs.filter((i: Inefficiency) => i.severity === 'HIGH').slice(0, 3);
        
        if (highIneffs.length > 0) {
          highIneffs.forEach((ineff: Inefficiency) => {
            console.log(chalk.red(`[${ineff.type}]`) + ` ${ineff.question.substring(0, 45)}...`);
            console.log(chalk.gray(`  ${ineff.description.substring(0, 80)}`));
          });
        } else {
          console.log(chalk.gray('No high-severity inefficiencies detected.'));
        }

        // 3. Whale Activity
        console.log(chalk.bold.cyan('\n🐋 Recent Whale Activity\n'));
        const whales = await scanner.identifyWhales();
        const topWhales = whales.slice(0, 3);
        
        if (topWhales.length > 0) {
          topWhales.forEach((whale: Whale, i: number) => {
            const pnlColor = whale.profitLoss > 0 ? chalk.green : chalk.red;
            console.log(`${i + 1}. ${whale.address.slice(0, 8)}... | Volume: $${(whale.totalVolume / 1000).toFixed(1)}k | Win Rate: ${(whale.winRate * 100).toFixed(1)}% | P&L: ${pnlColor(`$${whale.profitLoss.toFixed(0)}`)}`);
          });
        } else {
          console.log(chalk.gray('No whale activity detected.'));
        }

        console.log(chalk.gray(`\n📊 ${markets.length} markets tracked | ${arbs.length} arb opportunities | ${ineffs.length} inefficiencies | ${whales.length} whales`));
        
      } catch (error) {
        console.error(chalk.red('Error in full scan:'), error);
      }
    };

    await runFullScan();
    console.log(chalk.blue(`\n👀 Auto-refresh every ${options.interval}s...`));
    setInterval(runFullScan, parseInt(options.interval) * 1000);
  });

// Export command for War Room integration
program
  .command('export')
  .description('Export data for War Room integration')
  .option('-f, --format <string>', 'Export format (json/csv)', 'json')
  .action(async (options) => {
    try {
      const markets = await scanner.fetchMarkets();
      const arbs = await scanner.detectArbitrage(markets);
      const ineffs = await scanner.detectInefficiencies(markets);
      const whales = await scanner.identifyWhales();

      const data = {
        timestamp: new Date().toISOString(),
        markets: markets.length,
        arbitrage: arbs,
        inefficiencies: ineffs,
        whales: whales,
      };

      if (options.format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        // Simple CSV for arbitrage
        console.log('market_id,question,yes_price,no_price,sum,edge,liquidity');
        arbs.forEach((arb: ArbitrageOpportunity) => {
          console.log(`${arb.marketId},"${arb.question}",${arb.yesPrice},${arb.noPrice},${arb.sum},${arb.edge},${arb.liquidity}`);
        });
      }
    } catch (error) {
      console.error(chalk.red('Error exporting data:'), error);
    }
  });

program.parse();
