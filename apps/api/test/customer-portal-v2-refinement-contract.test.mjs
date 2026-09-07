import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("Remember Me remains server-backed and configurable without a schema change", () => {
  const dto = read("apps/api/src/modules/auth/dto/login.dto.ts");
  const controller = read("apps/api/src/modules/auth/auth.controller.ts");
  const auth = read("apps/api/src/modules/auth/auth.service.ts");
  const sessions = read("apps/api/src/modules/auth/session.service.ts");
  const env = read("apps/api/src/config/env.validation.ts");

  assert.match(dto, /rememberMe\?: boolean/);
  assert.match(controller, /dto\.rememberMe \?\? false/);
  assert.match(auth, /createSession\(\s*user\.id,\s*rememberMe/s);
  assert.match(sessions, /AUTH_REMEMBER_SESSION_IDLE_TTL_SECONDS/);
  assert.match(sessions, /AUTH_REMEMBER_SESSION_ABSOLUTE_TTL_SECONDS/);
  assert.match(env, /default\(604800\)/);
  assert.match(env, /default\(2592000\)/);
});

test("service assignment listing adds one scoped customer-visible feature preview query", () => {
  const services = read("apps/api/src/modules/services/services.service.ts");
  const types = read("packages/types/src/index.ts");

  assert.match(services, /companyServiceFeature\.findMany/);
  assert.match(
    services,
    /companyServiceId:\s*\{\s*in:\s*records\.map/s,
  );
  assert.match(
    services,
    /customerVisibleOverride\s*\?\?\s*feature\.serviceFeature\.customerVisible/,
  );
  assert.match(services, /featurePreview:\s*visibleFeatures\.slice\(0,\s*5\)/);
  assert.match(services, /visibleFeatureCount:\s*visibleFeatures\.length/);
  assert.match(types, /interface CustomerServiceAssignmentCard/);
});
