const path = require("node:path");

// Only known numeric counters are logged; never serialize job payloads or errors.
function counters(value, keys) {
  return Object.fromEntries(keys
    .filter((key) => Number.isSafeInteger(value?.[key]) && value[key] >= 0)
    .map((key) => [key, value[key]]));
}

async function runSystemJobsOnce() {
  let prisma;
  let exitCode = 0;
  let status = "failed";
  console.log("[worker:once] inicio", { at: new Date().toISOString() });

  try {
    // Cron may start outside the project directory. Existing environment wins.
    require("dotenv").config({
      path: path.resolve(__dirname, "../.env"),
      quiet: true,
    });
    const { validateEnv } = require("../src/config/validateEnv");
    // validateEnv may call process.exit(1); no Prisma client exists yet.
    const env = validateEnv();
    prisma = require("../src/database/prisma");

    if (env.SYSTEM_WORKER_ENABLED !== "true") {
      status = "disabled";
      console.log("[worker:once] desativado por configuracao");
    } else {
      const { runSystemJobsCycle } = require("../src/modules/systemJobs/systemJobs.service");
      const result = await runSystemJobsCycle();
      const scheduler = counters(result.retentionScheduler?.result,
        ["processed", "scheduled", "skipped", "failed"]);
      const executor = counters(result.retentionExecutor?.result,
        ["processed", "completed", "skipped", "failed"]);
      exitCode = scheduler.failed > 0 || executor.failed > 0 ? 1 : 0;
      status = exitCode === 0 ? "success" : "failed";
      console.log("[worker:once] resultado", {
        status,
        maintenance: counters(result.maintenance, [
          "recoveredRetentionExecutions", "recoveredR2Purges",
          "deletedAdminSessions", "deletedReporterSessions", "deletedOneTimeTokens",
        ]),
        retentionScheduler: {
          enabled: result.retentionScheduler?.enabled === true,
          ...scheduler,
        },
        retentionExecutor: {
          enabled: result.retentionExecutor?.enabled === true,
          ...executor,
        },
      });
    }
  } catch {
    exitCode = 1;
    status = "failed";
    console.error("[worker:once] falha na inicializacao ou execucao");
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch {
        exitCode = 1;
        status = "failed";
        console.error("[worker:once] falha ao encerrar conexao Prisma");
      }
    }
    console.log("[worker:once] termino", {
      at: new Date().toISOString(), status, exitCode,
    });
  }

  return exitCode;
}

if (require.main === module) {
  runSystemJobsOnce().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = { runSystemJobsOnce };
