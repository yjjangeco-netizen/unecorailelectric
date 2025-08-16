#!/usr/bin/env node

/**
 * 메모리 누수 테스트 스크립트
 * 
 * 이 스크립트는 애플리케이션의 메모리 사용량을 모니터링하고
 * 잠재적인 메모리 누수를 감지합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MemoryMonitor {
  constructor() {
    this.memorySnapshots = [];
    this.testDuration = 60000; // 60초
    this.snapshotInterval = 5000; // 5초마다
    this.maxMemoryGrowth = 50; // 50MB 이상 증가 시 경고
  }

  /**
   * 메모리 사용량 스냅샷 생성
   */
  async takeMemorySnapshot() {
    try {
      const memoryUsage = process.memoryUsage();
      const snapshot = {
        timestamp: new Date().toISOString(),
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      };

      this.memorySnapshots.push(snapshot);
      console.log(`📊 메모리 스냅샷: ${snapshot.rss}MB RSS, ${snapshot.heapUsed}MB Heap`);

      return snapshot;
    } catch (error) {
      console.error('❌ 메모리 스냅샷 생성 실패:', error.message);
      return null;
    }
  }

  /**
   * 메모리 성장률 분석
   */
  analyzeMemoryGrowth() {
    if (this.memorySnapshots.length < 2) {
      console.log('⚠️  스냅샷이 부족하여 분석할 수 없습니다.');
      return;
    }

    const first = this.memorySnapshots[0];
    const last = this.memorySnapshots[this.memorySnapshots.length - 1];
    
    const rssGrowth = last.rss - first.rss;
    const heapGrowth = last.heapUsed - first.heapUsed;

    console.log('\n📈 메모리 성장률 분석:');
    console.log(`   RSS: ${first.rss}MB → ${last.rss}MB (${rssGrowth > 0 ? '+' : ''}${rssGrowth}MB)`);
    console.log(`   Heap: ${first.heapUsed}MB → ${last.heapUsed}MB (${heapGrowth > 0 ? '+' : ''}${heapGrowth}MB)`);

    if (rssGrowth > this.maxMemoryGrowth) {
      console.log(`⚠️  경고: RSS 메모리가 ${this.maxMemoryGrowth}MB 이상 증가했습니다!`);
    }

    if (heapGrowth > this.maxMemoryGrowth) {
      console.log(`⚠️  경고: Heap 메모리가 ${this.maxMemoryGrowth}MB 이상 증가했습니다!`);
    }

    // 메모리 누수 패턴 분석
    this.analyzeMemoryPattern();
  }

  /**
   * 메모리 패턴 분석
   */
  analyzeMemoryPattern() {
    const rssValues = this.memorySnapshots.map(s => s.rss);
    const heapValues = this.memorySnapshots.map(s => s.heapUsed);

    // 지속적인 증가 패턴 확인
    let rssIncreasing = 0;
    let heapIncreasing = 0;

    for (let i = 1; i < rssValues.length; i++) {
      if (rssValues[i] > rssValues[i-1]) rssIncreasing++;
      if (heapValues[i] > heapValues[i-1]) heapIncreasing++;
    }

    const rssIncreaseRate = (rssIncreasing / (rssValues.length - 1)) * 100;
    const heapIncreaseRate = (heapIncreasing / (heapValues.length - 1)) * 100;

    console.log('\n🔍 메모리 패턴 분석:');
    console.log(`   RSS 증가율: ${rssIncreaseRate.toFixed(1)}%`);
    console.log(`   Heap 증가율: ${heapIncreaseRate.toFixed(1)}%`);

    if (rssIncreaseRate > 70) {
      console.log('⚠️  경고: RSS 메모리가 지속적으로 증가하고 있습니다!');
    }

    if (heapIncreaseRate > 70) {
      console.log('⚠️  경고: Heap 메모리가 지속적으로 증가하고 있습니다!');
    }
  }

  /**
   * 메모리 테스트 실행
   */
  async runMemoryTest() {
    console.log('🚀 메모리 누수 테스트 시작...\n');

    // 초기 메모리 스냅샷
    await this.takeMemorySnapshot();

    // 주기적으로 메모리 스냅샷 생성
    const snapshotInterval = setInterval(async () => {
      await this.takeMemorySnapshot();
    }, this.snapshotInterval);

    // 테스트 종료 후 정리
    setTimeout(() => {
      clearInterval(snapshotInterval);
      this.analyzeMemoryGrowth();
      this.generateReport();
      console.log('\n✅ 메모리 테스트 완료!');
    }, this.testDuration);
  }

  /**
   * 테스트 리포트 생성
   */
  generateReport() {
    const report = {
      testName: 'Memory Leak Test',
      timestamp: new Date().toISOString(),
      duration: this.testDuration / 1000,
      snapshots: this.memorySnapshots,
      summary: {
        totalSnapshots: this.memorySnapshots.length,
        initialMemory: this.memorySnapshots[0]?.rss || 0,
        finalMemory: this.memorySnapshots[this.memorySnapshots.length - 1]?.rss || 0,
        memoryGrowth: (this.memorySnapshots[this.memorySnapshots.length - 1]?.rss || 0) - (this.memorySnapshots[0]?.rss || 0),
      }
    };

    const reportPath = path.join(__dirname, 'memory-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 리포트 생성: ${reportPath}`);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  const monitor = new MemoryMonitor();
  
  try {
    await monitor.runMemoryTest();
  } catch (error) {
    console.error('❌ 메모리 테스트 실행 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  main();
}

module.exports = MemoryMonitor;
