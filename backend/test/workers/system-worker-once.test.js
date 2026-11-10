const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const filename = path.resolve(__dirname, "../../scripts/runSystemJobsOnce.js");
const source = fs.readFileSync(filename, "utf8");

// A closed require allowlist prevents loading .env, Prisma or real jobs.
function harness(options = {}) {
  const events = [];
  const logs = [];
  const module = { exports: {} };
  const processMock = { exitCode: undefined };
  const mocks = {
    "node:path": path,
    dotenv: { config(config) {
      events.push("dotenv");
      assert.equal(config.path, path.resolve(path.dirname(filename), "../.env"));
      assert.equal(config.quiet, true);
    } },
    "../src/config/validateEnv": { validateEnv() {
      events.push("validate");
      if (options.invalid) throw new Error("SECRET validation");
      return { SYSTEM_WORKER_ENABLED: options.disabled ? "false" : "true" };
    } },
    "../src/database/prisma": { async $disconnect() {
      events.push("disconnect");
      await Promise.resolve();
      if (options.disconnectFailure) throw new Error("SECRET database URL");
      events.push("disconnected");
    } },
    "../src/modules/systemJobs/systemJobs.service": { async runSystemJobsCycle() {
      events.push("cycle");
      if (options.failure) throw new Error("SECRET credentials");
      return {
        maintenance: { deletedAdminSessions: 2, identity: "SECRET" },
        retentionScheduler: { enabled: true, result: {
          processed: 1, failed: options.partialFailure ? 1 : 0,
          reports: ["SECRET"],
        } },
        retentionExecutor: { enabled: false, result: { message: "SECRET" } },
      };
    } },
  };
  function mockRequire(name) {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected dependency: ${name}`);
    events.push(`require:${name}`);
    return mocks[name];
  }
  mockRequire.main = options.cli ? module : null;
  vm.runInNewContext(source, {
    require: mockRequire, module, process: processMock,
    __dirname: path.dirname(filename),
    console: {
      log: (...args) => logs.push(args),
      error: (...args) => logs.push(args),
    },
    // Scheduling another cycle must fail the test.
    setTimeout() { assert.fail("Unexpected timer"); },
    setInterval() { assert.fail("Unexpected interval"); },
  }, { filename });
  return { run: module.exports.runSystemJobsOnce, events, logs, processMock };
}

for (const [name, options, expectedCode, cycles] of [
  ["sucesso", {}, 0, 1],
  ["falha no ciclo", { failure: true }, 1, 1],
  ["worker desativado", { disabled: true }, 0, 0],
  ["falha ao desconectar", { disconnectFailure: true }, 1, 1],
  ["falha no ciclo e desconexao", { failure: true, disconnectFailure: true }, 1, 1],
  ["falha parcial do lote", { partialFailure: true }, 1, 1],
]) {
  test(`${name}: codigo de saida, ciclo unico e desconexao`, async () => {
    const h = harness(options);
    assert.equal(await h.run(), expectedCode);
    assert.equal(h.events.filter((event) => event === "cycle").length, cycles);
    assert.equal(h.events.filter((event) => event === "disconnect").length, 1);
    assert.ok(h.events.indexOf("dotenv") < h.events.indexOf("validate"));
    assert.ok(h.events.indexOf("validate") < h.events.indexOf("require:../src/database/prisma"));
    if (!options.disconnectFailure) assert.equal(h.events.at(-1), "disconnected");
    if (!cycles) assert.ok(!h.events.includes("require:../src/modules/systemJobs/systemJobs.service"));
    assert.match(h.logs[0][0], /inicio/);
    assert.match(h.logs.at(-1)[0], /termino/);
    assert.equal(h.logs.at(-1)[1].exitCode, expectedCode);
    assert.doesNotMatch(JSON.stringify(h.logs), /SECRET/);
  });
}

test("validacao falha antes de carregar Prisma ou jobs", async () => {
  const h = harness({ invalid: true });
  assert.equal(await h.run(), 1);
  assert.ok(!h.events.includes("require:../src/database/prisma"));
  assert.ok(!h.events.includes("cycle"));
});

for (const failure of [false, true]) {
  test(`entrada CLI define process.exitCode apos desconectar (falha=${failure})`, async () => {
    const h = harness({ cli: true, failure });
    // Flush the async entry point without introducing scheduling in the worker.
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.processMock.exitCode, failure ? 1 : 0);
    assert.equal(h.events.at(-1), "disconnected");
  });
}
